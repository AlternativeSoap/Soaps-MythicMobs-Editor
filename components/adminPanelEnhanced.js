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

        // Prevent duplicate injection
        if (tabContainer.querySelector('[data-tab="errors"]')) {
            console.log('[AdminPanelEnhanced] Tabs already injected, skipping');
            return;
        }

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
                        <h3><i class="fas fa-chart-line"></i> Analytics Dashboard</h3>
                        <p>Real-time usage statistics and user tracking</p>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-danger" id="btnResetAnalytics" title="Reset all analytics data">
                            <i class="fas fa-trash-alt"></i> Reset Data
                        </button>
                        <button class="btn btn-primary" id="btnRefreshAnalytics">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>
                </div>

                <!-- Live Stats Banner -->
                <div class="live-stats-banner" style="background: linear-gradient(135deg, #1e1e2e 0%, #2d1f3d 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid rgba(139, 92, 246, 0.3);">
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div class="pulse-dot" style="width: 12px; height: 12px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite;"></div>
                            <span style="font-size: 16px; font-weight: 600; color: white;">Live Tracking Active</span>
                        </div>
                        <div style="display: flex; gap: 30px; flex-wrap: wrap;">
                            <div style="text-align: center;">
                                <div style="font-size: 28px; font-weight: bold; color: #10b981;" id="liveOnlineCount">-</div>
                                <div style="font-size: 12px; color: rgba(255,255,255,0.7);">Online Now</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 28px; font-weight: bold; color: #8b5cf6;" id="liveTodayViews">-</div>
                                <div style="font-size: 12px; color: rgba(255,255,255,0.7);">Today's Views</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 28px; font-weight: bold; color: #f59e0b;" id="liveTodayActions">-</div>
                                <div style="font-size: 12px; color: rgba(255,255,255,0.7);">Actions Today</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Time Period Tracker Section -->
                <div class="time-period-tracker" style="margin-bottom: 25px;">
                    <div class="section-header" style="margin-bottom: 15px;">
                        <h4><i class="fas fa-calendar-alt" style="color: #8b5cf6;"></i> Activity Tracker</h4>
                    </div>
                    
                    <!-- Time Period Cards -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px;">
                        <!-- Daily Card -->
                        <div class="time-period-card" style="background: linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%); border-radius: 12px; padding: 20px; border: 1px solid rgba(59, 130, 246, 0.3);">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                                <div style="width: 45px; height: 45px; background: rgba(59, 130, 246, 0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-sun" style="font-size: 20px; color: #3b82f6;"></i>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">Today</div>
                                    <div style="font-size: 24px; font-weight: bold; color: #3b82f6;" id="dailyActivityCount">-</div>
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                                <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 18px; font-weight: bold; color: white;" id="dailyUsers">-</div>
                                    <div style="font-size: 10px; color: rgba(255,255,255,0.6);">Users</div>
                                </div>
                                <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 18px; font-weight: bold; color: white;" id="dailyPageViews">-</div>
                                    <div style="font-size: 10px; color: rgba(255,255,255,0.6);">Page Views</div>
                                </div>
                                <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 18px; font-weight: bold; color: white;" id="dailyNewUsers">-</div>
                                    <div style="font-size: 10px; color: rgba(255,255,255,0.6);">New Users</div>
                                </div>
                                <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 18px; font-weight: bold; color: white;" id="dailyTemplates">-</div>
                                    <div style="font-size: 10px; color: rgba(255,255,255,0.6);">Templates</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Monthly Card -->
                        <div class="time-period-card" style="background: linear-gradient(135deg, #3d1f5c 0%, #1f1035 100%); border-radius: 12px; padding: 20px; border: 1px solid rgba(139, 92, 246, 0.3);">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                                <div style="width: 45px; height: 45px; background: rgba(139, 92, 246, 0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-calendar-week" style="font-size: 20px; color: #8b5cf6;"></i>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">This Month</div>
                                    <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;" id="monthlyActivityCount">-</div>
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                                <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 18px; font-weight: bold; color: white;" id="monthlyUsers">-</div>
                                    <div style="font-size: 10px; color: rgba(255,255,255,0.6);">Active Users</div>
                                </div>
                                <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 18px; font-weight: bold; color: white;" id="monthlyPageViews">-</div>
                                    <div style="font-size: 10px; color: rgba(255,255,255,0.6);">Page Views</div>
                                </div>
                                <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 18px; font-weight: bold; color: white;" id="monthlyNewUsers">-</div>
                                    <div style="font-size: 10px; color: rgba(255,255,255,0.6);">New Users</div>
                                </div>
                                <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 18px; font-weight: bold; color: white;" id="monthlyTemplates">-</div>
                                    <div style="font-size: 10px; color: rgba(255,255,255,0.6);">Templates</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Yearly Card -->
                        <div class="time-period-card" style="background: linear-gradient(135deg, #5c3d1f 0%, #352010 100%); border-radius: 12px; padding: 20px; border: 1px solid rgba(245, 158, 11, 0.3);">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                                <div style="width: 45px; height: 45px; background: rgba(245, 158, 11, 0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-calendar" style="font-size: 20px; color: #f59e0b;"></i>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">This Year</div>
                                    <div style="font-size: 24px; font-weight: bold; color: #f59e0b;" id="yearlyActivityCount">-</div>
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                                <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 18px; font-weight: bold; color: white;" id="yearlyUsers">-</div>
                                    <div style="font-size: 10px; color: rgba(255,255,255,0.6);">Total Users</div>
                                </div>
                                <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 18px; font-weight: bold; color: white;" id="yearlyPageViews">-</div>
                                    <div style="font-size: 10px; color: rgba(255,255,255,0.6);">Page Views</div>
                                </div>
                                <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 18px; font-weight: bold; color: white;" id="yearlyNewUsers">-</div>
                                    <div style="font-size: 10px; color: rgba(255,255,255,0.6);">New Users</div>
                                </div>
                                <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 18px; font-weight: bold; color: white;" id="yearlyTemplates">-</div>
                                    <div style="font-size: 10px; color: rgba(255,255,255,0.6);">Templates</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Activity Trend Graph -->
                    <div class="chart-container" style="background: var(--bg-secondary); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h4 style="margin: 0;"><i class="fas fa-chart-area" style="color: #10b981;"></i> Activity Trend</h4>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn btn-sm chart-period-btn active" data-period="daily" style="padding: 5px 12px; font-size: 12px;">Daily</button>
                                <button class="btn btn-sm chart-period-btn" data-period="monthly" style="padding: 5px 12px; font-size: 12px;">Monthly</button>
                                <button class="btn btn-sm chart-period-btn" data-period="yearly" style="padding: 5px 12px; font-size: 12px;">Yearly</button>
                            </div>
                        </div>
                        <div id="activityTrendChart" style="height: 250px; position: relative;">
                            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">
                                <i class="fas fa-spinner fa-spin"></i> Loading chart...
                            </div>
                        </div>
                    </div>
                    
                    <!-- Comparison Charts Row -->
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                        <div class="chart-container" style="background: var(--bg-secondary); border-radius: 12px; padding: 20px;">
                            <h4 style="margin: 0 0 15px 0;"><i class="fas fa-users" style="color: #3b82f6;"></i> User Growth</h4>
                            <div id="userGrowthChart" style="height: 200px; position: relative;">
                                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">
                                    Loading...
                                </div>
                            </div>
                        </div>
                        <div class="chart-container" style="background: var(--bg-secondary); border-radius: 12px; padding: 20px;">
                            <h4 style="margin: 0 0 15px 0;"><i class="fas fa-eye" style="color: #8b5cf6;"></i> Page Views Distribution</h4>
                            <div id="pageViewsDistChart" style="height: 200px; position: relative;">
                                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">
                                    Loading...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Key Metrics Grid -->
                <div class="analytics-metrics" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 25px;">
                    <div class="metric-card metric-users">
                        <div class="metric-icon"><i class="fas fa-users"></i></div>
                        <div class="metric-value" id="totalUsersMetric">-</div>
                        <div class="metric-label">Total Users</div>
                        <div class="metric-change" id="usersChange">-</div>
                        <button class="btn-metric-reset" onclick="window.adminPanelEnhanced?.resetMetric('users')" title="This count is live from database">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                    <div class="metric-card metric-templates">
                        <div class="metric-icon"><i class="fas fa-layer-group"></i></div>
                        <div class="metric-value" id="totalTemplatesMetric">-</div>
                        <div class="metric-label">Templates</div>
                        <div class="metric-change" id="templatesChange">-</div>
                        <button class="btn-metric-reset" onclick="window.adminPanelEnhanced?.resetMetric('templates')" title="This count is live from database">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                    <div class="metric-card metric-downloads">
                        <div class="metric-icon"><i class="fas fa-download"></i></div>
                        <div class="metric-value" id="totalDownloadsMetric">-</div>
                        <div class="metric-label">Activity Count</div>
                        <div class="metric-change" id="downloadsChange">-</div>
                        <button class="btn-metric-reset" onclick="window.adminPanelEnhanced?.confirmResetMetric('downloads')" title="Reset activity logs">
                            <i class="fas fa-redo"></i>
                        </button>
                    </div>
                    <div class="metric-card metric-active">
                        <div class="metric-icon"><i class="fas fa-clock"></i></div>
                        <div class="metric-value" id="activeUsersMetric">-</div>
                        <div class="metric-label">Active Today</div>
                        <div class="metric-change" id="activeChange">-</div>
                        <button class="btn-metric-reset" onclick="window.adminPanelEnhanced?.confirmResetMetric('active')" title="Reset daily activity">
                            <i class="fas fa-redo"></i>
                        </button>
                    </div>
                </div>

                <!-- Secondary Metrics Row -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 25px;">
                    <div class="metric-card online-users-card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                        <div class="metric-icon" style="color: rgba(255,255,255,0.9);"><i class="fas fa-circle" style="color: #4ade80; animation: pulse 2s infinite;"></i></div>
                        <div class="metric-value" id="onlineUsersMetric" style="color: white;">-</div>
                        <div class="metric-label" style="color: rgba(255,255,255,0.9);">Online Now</div>
                        <div class="metric-change" id="onlineUsersChange" style="color: rgba(255,255,255,0.7);">Real-time</div>
                        <button class="btn-metric-reset" onclick="window.adminPanelEnhanced?.confirmResetMetric('sessions')" title="Clear all sessions" style="color: white;">
                            <i class="fas fa-redo"></i>
                        </button>
                    </div>
                    <div class="metric-card metric-registrations">
                        <div class="metric-icon"><i class="fas fa-user-plus"></i></div>
                        <div class="metric-value" id="newRegistrationsMetric">-</div>
                        <div class="metric-label">New Registrations</div>
                        <div class="metric-change" id="registrationsChange">Last 7 days</div>
                    </div>
                    <div class="metric-card metric-pageviews">
                        <div class="metric-icon"><i class="fas fa-eye"></i></div>
                        <div class="metric-value" id="pageViewsMetric">-</div>
                        <div class="metric-label">Page Views</div>
                        <div class="metric-change" id="pageViewsChange">Last 7 days</div>
                        <button class="btn-metric-reset" onclick="window.adminPanelEnhanced?.confirmResetMetric('pageviews')" title="Reset page views">
                            <i class="fas fa-redo"></i>
                        </button>
                    </div>
                </div>

                <!-- Online Users Section -->
                <div class="analytics-section online-users-section" style="margin-bottom: 25px;">
                    <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4><i class="fas fa-wifi" style="color: #10b981;"></i> Currently Online Users</h4>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-sm btn-secondary" id="btnRefreshOnlineUsers">
                                <i class="fas fa-sync-alt"></i> Refresh
                            </button>
                        </div>
                    </div>
                    <div id="onlineUsersList" class="online-users-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; max-height: 350px; overflow-y: auto; padding: 15px; background: var(--bg-secondary); border-radius: 10px;">
                        <div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> Loading online users...</div>
                    </div>
                </div>

                <!-- All Users Activity Section -->
                <div class="analytics-section user-activity-section" style="margin-bottom: 25px;">
                    <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                        <h4><i class="fas fa-users-cog" style="color: #8b5cf6;"></i> All Users Activity</h4>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <input type="text" id="userActivitySearch" class="form-input" placeholder="Search users..." style="width: 200px;">
                            <select id="userActivityFilter" class="form-select" style="width: 150px;">
                                <option value="all">All Users</option>
                                <option value="active">Active Today</option>
                                <option value="new">New (7 days)</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div id="allUsersList" class="all-users-list" style="max-height: 450px; overflow-y: auto; border-radius: 10px;">
                        <div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> Loading users...</div>
                    </div>
                </div>

                <!-- Popular Templates Section -->
                <div class="analytics-section popular-templates" style="margin-top: 25px;">
                    <div class="section-header" style="margin-bottom: 15px;">
                        <h4><i class="fas fa-trophy" style="color: #f59e0b;"></i> Most Popular Templates</h4>
                    </div>
                    <div id="popularTemplatesList" style="background: var(--bg-secondary); border-radius: 10px; padding: 15px;"></div>
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

                    <!-- Template Limits -->
                    <div class="settings-section">
                        <h4><i class="fas fa-layer-group"></i> Template Limits</h4>
                        <div class="form-group">
                            <label>Max Templates per User</label>
                            <input type="number" id="maxTemplatesPerUser" class="form-input" value="10" min="1" max="100">
                            <small style="color: var(--text-secondary); display: block; margin-top: 5px;">Maximum number of templates a single user can create (does not apply to admins)</small>
                        </div>
                        <div class="form-group">
                            <label>Max Pending Templates per User</label>
                            <input type="number" id="maxPendingTemplatesPerUser" class="form-input" value="3" min="1" max="20">
                            <small style="color: var(--text-secondary); display: block; margin-top: 5px;">Maximum templates waiting for approval per user</small>
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
            if (e.target.closest('#btnRefreshOnlineUsers')) {
                this.loadOnlineUsers();
            }
            if (e.target.closest('#btnResetAnalytics')) {
                this.showResetAnalyticsDialog();
            }
            // Handle user card clicks
            if (e.target.closest('.user-activity-card')) {
                const card = e.target.closest('.user-activity-card');
                const userId = card.dataset.userId;
                if (userId) {
                    this.showUserActivityModal(userId);
                }
            }
        });
        
        // User search and filter
        document.addEventListener('input', (e) => {
            if (e.target.id === 'userActivitySearch') {
                this.filterUsersList();
            }
        });
        document.addEventListener('change', (e) => {
            if (e.target.id === 'userActivityFilter') {
                this.filterUsersList();
            }
        });
    }

    /**
     * Show reset analytics confirmation dialog
     */
    showResetAnalyticsDialog() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'resetAnalyticsModal';
        modal.style.cssText = 'display: flex; z-index: 10300;';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2><i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i> Reset Analytics Data</h2>
                    <button class="btn-close" onclick="document.getElementById('resetAnalyticsModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <p style="margin-bottom: 20px; color: var(--text-secondary);">
                        Select which analytics data to reset. <strong>Note:</strong> "Total Users" and "Templates" cannot be reset as they are live counts from the database.
                    </p>
                    
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <label class="checkbox-label" style="display: flex; align-items: center; gap: 10px; padding: 12px; background: var(--bg-secondary); border-radius: 8px; cursor: pointer;">
                            <input type="checkbox" id="resetSessions" value="sessions">
                            <div>
                                <strong>Online Sessions</strong>
                                <small style="display: block; color: var(--text-secondary);">Clear all active user sessions</small>
                            </div>
                        </label>
                        
                        <label class="checkbox-label" style="display: flex; align-items: center; gap: 10px; padding: 12px; background: var(--bg-secondary); border-radius: 8px; cursor: pointer;">
                            <input type="checkbox" id="resetPageViews" value="pageviews">
                            <div>
                                <strong>Page Views</strong>
                                <small style="display: block; color: var(--text-secondary);">Reset all page view tracking data</small>
                            </div>
                        </label>
                        
                        <label class="checkbox-label" style="display: flex; align-items: center; gap: 10px; padding: 12px; background: var(--bg-secondary); border-radius: 8px; cursor: pointer;">
                            <input type="checkbox" id="resetActivityLogs" value="activity">
                            <div>
                                <strong>Activity Logs</strong>
                                <small style="display: block; color: var(--text-secondary);">Clear user activity history (downloads, actions)</small>
                            </div>
                        </label>
                        
                        <label class="checkbox-label" style="display: flex; align-items: center; gap: 10px; padding: 12px; background: var(--bg-secondary); border-radius: 8px; cursor: pointer;">
                            <input type="checkbox" id="resetDetailedActivity" value="detailed">
                            <div>
                                <strong>Detailed Activity</strong>
                                <small style="display: block; color: var(--text-secondary);">Clear detailed user tracking data</small>
                            </div>
                        </label>
                        
                        <label class="checkbox-label" style="display: flex; align-items: center; gap: 10px; padding: 12px; background: var(--bg-secondary); border-radius: 8px; cursor: pointer;">
                            <input type="checkbox" id="resetDailyStats" value="dailystats">
                            <div>
                                <strong>Daily Statistics</strong>
                                <small style="display: block; color: var(--text-secondary);">Reset pre-aggregated daily stats</small>
                            </div>
                        </label>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px;">
                        <p style="color: #ef4444; font-size: 13px; margin: 0;">
                            <i class="fas fa-warning"></i> <strong>Warning:</strong> This action cannot be undone. The selected data will be permanently deleted.
                        </p>
                    </div>
                </div>
                <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 15px 20px; border-top: 1px solid var(--border-color);">
                    <button class="btn btn-secondary" onclick="document.getElementById('resetAnalyticsModal').remove()">Cancel</button>
                    <button class="btn btn-danger" id="btnConfirmReset"><i class="fas fa-trash-alt"></i> Reset Selected</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // Confirm reset
        document.getElementById('btnConfirmReset').addEventListener('click', async () => {
            const selections = {
                sessions: document.getElementById('resetSessions').checked,
                pageviews: document.getElementById('resetPageViews').checked,
                activity: document.getElementById('resetActivityLogs').checked,
                detailed: document.getElementById('resetDetailedActivity').checked,
                dailystats: document.getElementById('resetDailyStats').checked
            };
            
            if (!Object.values(selections).some(v => v)) {
                window.notificationModal?.alert('Please select at least one data type to reset.', 'warning', 'No Selection');
                return;
            }
            
            await this.executeAnalyticsReset(selections);
            modal.remove();
        });
    }

    /**
     * Execute analytics data reset
     */
    async executeAnalyticsReset(selections) {
        if (!window.supabaseClient) {
            window.notificationModal?.alert('Database connection not available.', 'error', 'Error');
            return;
        }

        const results = [];
        
        try {
            if (selections.sessions) {
                const { error } = await window.supabaseClient
                    .from('user_sessions')
                    .delete()
                    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
                if (error) throw error;
                results.push('Sessions cleared');
            }
            
            if (selections.pageviews) {
                const { error } = await window.supabaseClient
                    .from('page_views')
                    .delete()
                    .neq('id', '00000000-0000-0000-0000-000000000000');
                if (error) throw error;
                results.push('Page views cleared');
            }
            
            if (selections.activity) {
                const { error } = await window.supabaseClient
                    .from('user_activity_logs')
                    .delete()
                    .neq('id', '00000000-0000-0000-0000-000000000000');
                if (error) throw error;
                results.push('Activity logs cleared');
            }
            
            if (selections.detailed) {
                const { error } = await window.supabaseClient
                    .from('user_activity_detailed')
                    .delete()
                    .neq('id', '00000000-0000-0000-0000-000000000000');
                if (error) throw error;
                results.push('Detailed activity cleared');
            }
            
            if (selections.dailystats) {
                const { error } = await window.supabaseClient
                    .from('daily_stats')
                    .delete()
                    .neq('id', '00000000-0000-0000-0000-000000000000');
                if (error) throw error;
                results.push('Daily stats cleared');
            }
            
            window.notificationModal?.alert(
                `Successfully reset: ${results.join(', ')}`,
                'success',
                'Data Reset Complete'
            );
            
            // Refresh analytics
            this.loadAnalytics();
            
        } catch (error) {
            console.error('Reset analytics error:', error);
            window.notificationModal?.alert(
                `Error resetting data: ${error.message}`,
                'error',
                'Reset Failed'
            );
        }
    }

    /**
     * Confirm and reset a specific metric
     */
    async confirmResetMetric(metricType) {
        const typeNames = {
            'sessions': 'Online Sessions',
            'pageviews': 'Page Views',
            'downloads': 'Activity Logs',
            'active': 'Today\'s Activity',
            'detailed': 'Detailed Activity'
        };
        
        const confirmed = await new Promise(resolve => {
            if (window.notificationModal?.confirm) {
                window.notificationModal.confirm(
                    `Are you sure you want to reset ${typeNames[metricType] || metricType}? This cannot be undone.`,
                    (result) => resolve(result),
                    'warning',
                    'Confirm Reset'
                );
            } else {
                resolve(confirm(`Reset ${typeNames[metricType]}?`));
            }
        });
        
        if (confirmed) {
            const selections = {};
            selections[metricType === 'downloads' ? 'activity' : metricType] = true;
            await this.executeAnalyticsReset(selections);
        }
    }

    /**
     * Show info for non-resettable metrics
     */
    resetMetric(metricType) {
        if (metricType === 'users' || metricType === 'templates') {
            window.notificationModal?.alert(
                `${metricType === 'users' ? 'Total Users' : 'Templates'} count is a live count from the database and cannot be reset. It reflects the actual number of ${metricType} in the system.`,
                'info',
                'Live Count'
            );
        }
    }

    async loadAnalytics() {
        if (!window.supabaseClient) {
            console.warn('Supabase not available for analytics');
            return;
        }

        try {
            // Show loading state
            const metrics = ['totalUsersMetric', 'totalTemplatesMetric', 'totalDownloadsMetric', 'activeUsersMetric', 'onlineUsersMetric', 'newRegistrationsMetric', 'pageViewsMetric', 'liveOnlineCount', 'liveTodayViews', 'liveTodayActions'];
            metrics.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = '...';
            });

            // Fetch total users from user_profiles
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

            // Fetch online users (sessions active in last 5 minutes)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            let onlineCount = 0;
            try {
                const { count: onlineUsers } = await window.supabaseClient
                    .from('user_sessions')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_active', true)
                    .gte('last_seen_at', fiveMinutesAgo);
                onlineCount = onlineUsers || 0;
            } catch (e) {
                console.warn('Could not fetch online users:', e);
            }

            // Fetch new registrations (last 7 days)
            let newRegistrations = 0;
            try {
                const { count: newRegs } = await window.supabaseClient
                    .from('user_profiles')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', lastWeek.toISOString());
                newRegistrations = newRegs || 0;
            } catch (e) {
                console.warn('Could not fetch new registrations:', e);
            }

            // Fetch page views (last 7 days)
            let pageViews = 0;
            let todayPageViews = 0;
            try {
                const { count: views } = await window.supabaseClient
                    .from('page_views')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', lastWeek.toISOString());
                pageViews = views || 0;
                
                // Today's page views
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const { count: todayViews } = await window.supabaseClient
                    .from('page_views')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', todayStart.toISOString());
                todayPageViews = todayViews || 0;
            } catch (e) {
                console.warn('Could not fetch page views:', e);
            }

            // Fetch today's actions
            let todayActions = 0;
            try {
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const { count: actions } = await window.supabaseClient
                    .from('user_activity_logs')
                    .select('*', { count: 'exact', head: true })
                    .gte('timestamp', todayStart.toISOString());
                todayActions = actions || 0;
            } catch (e) {
                console.warn('Could not fetch today actions:', e);
            }

            // Update main metrics
            document.getElementById('totalUsersMetric').textContent = this.formatNumber(totalUsers || 0);
            document.getElementById('usersChange').textContent = totalUsers > 0 ? `${uniqueAdmins} admins` : 'No data';
            
            document.getElementById('totalTemplatesMetric').textContent = this.formatNumber(totalTemplates || 0);
            document.getElementById('templatesChange').textContent = totalTemplates > 0 ? 'Active templates' : 'No templates';
            
            document.getElementById('totalDownloadsMetric').textContent = this.formatNumber(activityLastWeek || 0);
            document.getElementById('downloadsChange').textContent = 'Last 7 days';
            
            document.getElementById('activeUsersMetric').textContent = this.formatNumber(activeToday || 0);
            document.getElementById('activeChange').textContent = 'Last 24 hours';

            // Update secondary metrics
            document.getElementById('onlineUsersMetric').textContent = this.formatNumber(onlineCount);
            document.getElementById('onlineUsersChange').textContent = 'Real-time';
            
            document.getElementById('newRegistrationsMetric').textContent = this.formatNumber(newRegistrations);
            document.getElementById('registrationsChange').textContent = 'Last 7 days';
            
            document.getElementById('pageViewsMetric').textContent = this.formatNumber(pageViews);
            document.getElementById('pageViewsChange').textContent = 'Last 7 days';

            // Update live stats banner
            const liveOnline = document.getElementById('liveOnlineCount');
            const liveTodayViewsEl = document.getElementById('liveTodayViews');
            const liveTodayActionsEl = document.getElementById('liveTodayActions');
            
            if (liveOnline) liveOnline.textContent = this.formatNumber(onlineCount);
            if (liveTodayViewsEl) liveTodayViewsEl.textContent = this.formatNumber(todayPageViews);
            if (liveTodayActionsEl) liveTodayActionsEl.textContent = this.formatNumber(todayActions);

            // Load time period stats
            await this.loadTimePeriodStats();

            // Update chart placeholders with simple visualization
            this.renderSimpleCharts();
            
            // Render activity trend charts
            await this.renderActivityTrendChart('daily');
            await this.renderUserGrowthChart();
            await this.renderPageViewsDistChart();
            
            // Setup chart period buttons
            this.setupChartPeriodButtons();

            // Load additional sections
            await this.loadOnlineUsers();
            await this.loadAllUsers();
            await this.loadPopularTemplates();

        } catch (error) {
            console.error('Failed to load analytics:', error);
            
            // Show error state
            ['totalUsersMetric', 'totalTemplatesMetric', 'totalDownloadsMetric', 'activeUsersMetric', 'onlineUsersMetric', 'newRegistrationsMetric', 'pageViewsMetric'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = 'Error';
            });
        }
    }

    /**
     * Render simple chart visualizations (no external library)
     */
    async renderSimpleCharts() {
        // Registration chart
        const regContainer = document.getElementById('registrationChartPlaceholder');
        if (regContainer) {
            try {
                const last7Days = [];
                for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    date.setHours(0, 0, 0, 0);
                    const nextDate = new Date(date);
                    nextDate.setDate(nextDate.getDate() + 1);
                    
                    const { count } = await window.supabaseClient
                        .from('user_profiles')
                        .select('*', { count: 'exact', head: true })
                        .gte('created_at', date.toISOString())
                        .lt('created_at', nextDate.toISOString());
                    
                    last7Days.push({
                        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                        count: count || 0
                    });
                }
                
                const maxCount = Math.max(...last7Days.map(d => d.count), 1);
                regContainer.innerHTML = `
                    <div style="display: flex; align-items: flex-end; justify-content: space-around; height: 180px; padding: 10px 0;">
                        ${last7Days.map(d => `
                            <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
                                <div style="background: linear-gradient(180deg, #8b5cf6, #6366f1); width: 30px; border-radius: 4px 4px 0 0; transition: height 0.3s;" 
                                     style="height: ${Math.max((d.count / maxCount) * 140, 4)}px;"></div>
                                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 8px;">${d.date}</div>
                                <div style="font-size: 12px; font-weight: 600; color: var(--text-primary);">${d.count}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } catch (e) {
                regContainer.innerHTML = '<span style="color: var(--text-secondary);">Could not load chart data</span>';
            }
        }

        // Template chart
        const tempContainer = document.getElementById('templateChartPlaceholder');
        if (tempContainer) {
            try {
                const last7Days = [];
                for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    date.setHours(0, 0, 0, 0);
                    const nextDate = new Date(date);
                    nextDate.setDate(nextDate.getDate() + 1);
                    
                    const { count } = await window.supabaseClient
                        .from('templates')
                        .select('*', { count: 'exact', head: true })
                        .gte('created_at', date.toISOString())
                        .lt('created_at', nextDate.toISOString())
                        .eq('deleted', false);
                    
                    last7Days.push({
                        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                        count: count || 0
                    });
                }
                
                const maxCount = Math.max(...last7Days.map(d => d.count), 1);
                tempContainer.innerHTML = `
                    <div style="display: flex; align-items: flex-end; justify-content: space-around; height: 180px; padding: 10px 0;">
                        ${last7Days.map(d => `
                            <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
                                <div style="background: linear-gradient(180deg, #10b981, #059669); width: 30px; border-radius: 4px 4px 0 0; height: ${Math.max((d.count / maxCount) * 140, 4)}px; transition: height 0.3s;"></div>
                                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 8px;">${d.date}</div>
                                <div style="font-size: 12px; font-weight: 600; color: var(--text-primary);">${d.count}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } catch (e) {
                tempContainer.innerHTML = '<span style="color: var(--text-secondary);">Could not load chart data</span>';
            }
        }
    }

    /**
     * Load time period statistics (daily, monthly, yearly)
     */
    async loadTimePeriodStats() {
        if (!window.supabaseClient) return;

        try {
            const now = new Date();
            
            // Daily (today)
            const todayStart = new Date(now);
            todayStart.setHours(0, 0, 0, 0);
            
            // Monthly (this month)
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            
            // Yearly (this year)
            const yearStart = new Date(now.getFullYear(), 0, 1);

            // Daily stats
            const [dailyActivity, dailyUsers, dailyPageViews, dailyNewUsers, dailyTemplates] = await Promise.all([
                window.supabaseClient.from('user_activity_logs').select('*', { count: 'exact', head: true }).gte('timestamp', todayStart.toISOString()),
                window.supabaseClient.from('user_sessions').select('user_id', { count: 'exact', head: true }).gte('last_seen_at', todayStart.toISOString()),
                window.supabaseClient.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
                window.supabaseClient.from('user_profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
                window.supabaseClient.from('templates').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()).eq('deleted', false)
            ]);

            // Monthly stats
            const [monthlyActivity, monthlyUsers, monthlyPageViews, monthlyNewUsers, monthlyTemplates] = await Promise.all([
                window.supabaseClient.from('user_activity_logs').select('*', { count: 'exact', head: true }).gte('timestamp', monthStart.toISOString()),
                window.supabaseClient.from('user_sessions').select('user_id', { count: 'exact', head: true }).gte('started_at', monthStart.toISOString()),
                window.supabaseClient.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()),
                window.supabaseClient.from('user_profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()),
                window.supabaseClient.from('templates').select('*', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()).eq('deleted', false)
            ]);

            // Yearly stats
            const [yearlyActivity, yearlyUsers, yearlyPageViews, yearlyNewUsers, yearlyTemplates] = await Promise.all([
                window.supabaseClient.from('user_activity_logs').select('*', { count: 'exact', head: true }).gte('timestamp', yearStart.toISOString()),
                window.supabaseClient.from('user_profiles').select('*', { count: 'exact', head: true }),
                window.supabaseClient.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', yearStart.toISOString()),
                window.supabaseClient.from('user_profiles').select('*', { count: 'exact', head: true }).gte('created_at', yearStart.toISOString()),
                window.supabaseClient.from('templates').select('*', { count: 'exact', head: true }).gte('created_at', yearStart.toISOString()).eq('deleted', false)
            ]);

            // Update Daily
            this.updateElement('dailyActivityCount', this.formatNumber(dailyActivity.count || 0));
            this.updateElement('dailyUsers', this.formatNumber(dailyUsers.count || 0));
            this.updateElement('dailyPageViews', this.formatNumber(dailyPageViews.count || 0));
            this.updateElement('dailyNewUsers', this.formatNumber(dailyNewUsers.count || 0));
            this.updateElement('dailyTemplates', this.formatNumber(dailyTemplates.count || 0));

            // Update Monthly
            this.updateElement('monthlyActivityCount', this.formatNumber(monthlyActivity.count || 0));
            this.updateElement('monthlyUsers', this.formatNumber(monthlyUsers.count || 0));
            this.updateElement('monthlyPageViews', this.formatNumber(monthlyPageViews.count || 0));
            this.updateElement('monthlyNewUsers', this.formatNumber(monthlyNewUsers.count || 0));
            this.updateElement('monthlyTemplates', this.formatNumber(monthlyTemplates.count || 0));

            // Update Yearly
            this.updateElement('yearlyActivityCount', this.formatNumber(yearlyActivity.count || 0));
            this.updateElement('yearlyUsers', this.formatNumber(yearlyUsers.count || 0));
            this.updateElement('yearlyPageViews', this.formatNumber(yearlyPageViews.count || 0));
            this.updateElement('yearlyNewUsers', this.formatNumber(yearlyNewUsers.count || 0));
            this.updateElement('yearlyTemplates', this.formatNumber(yearlyTemplates.count || 0));

        } catch (error) {
            console.error('Error loading time period stats:', error);
        }
    }

    /**
     * Helper to update element text content
     */
    updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    /**
     * Setup chart period toggle buttons
     */
    setupChartPeriodButtons() {
        document.querySelectorAll('.chart-period-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                document.querySelectorAll('.chart-period-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                await this.renderActivityTrendChart(e.target.dataset.period);
            });
        });
    }

    /**
     * Render activity trend chart based on period
     */
    async renderActivityTrendChart(period = 'daily') {
        const container = document.getElementById('activityTrendChart');
        if (!container || !window.supabaseClient) return;

        container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%;"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

        try {
            let data = [];
            const now = new Date();

            if (period === 'daily') {
                // Last 14 days
                for (let i = 13; i >= 0; i--) {
                    const date = new Date(now);
                    date.setDate(date.getDate() - i);
                    date.setHours(0, 0, 0, 0);
                    const nextDate = new Date(date);
                    nextDate.setDate(nextDate.getDate() + 1);

                    const [activity, pageViews] = await Promise.all([
                        window.supabaseClient.from('user_activity_logs').select('*', { count: 'exact', head: true })
                            .gte('timestamp', date.toISOString()).lt('timestamp', nextDate.toISOString()),
                        window.supabaseClient.from('page_views').select('*', { count: 'exact', head: true })
                            .gte('created_at', date.toISOString()).lt('created_at', nextDate.toISOString())
                    ]);

                    data.push({
                        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        activity: activity.count || 0,
                        pageViews: pageViews.count || 0
                    });
                }
            } else if (period === 'monthly') {
                // Last 12 months
                for (let i = 11; i >= 0; i--) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const nextDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);

                    const [activity, pageViews] = await Promise.all([
                        window.supabaseClient.from('user_activity_logs').select('*', { count: 'exact', head: true })
                            .gte('timestamp', date.toISOString()).lt('timestamp', nextDate.toISOString()),
                        window.supabaseClient.from('page_views').select('*', { count: 'exact', head: true })
                            .gte('created_at', date.toISOString()).lt('created_at', nextDate.toISOString())
                    ]);

                    data.push({
                        label: date.toLocaleDateString('en-US', { month: 'short' }),
                        activity: activity.count || 0,
                        pageViews: pageViews.count || 0
                    });
                }
            } else if (period === 'yearly') {
                // Last 5 years
                for (let i = 4; i >= 0; i--) {
                    const year = now.getFullYear() - i;
                    const date = new Date(year, 0, 1);
                    const nextDate = new Date(year + 1, 0, 1);

                    const [activity, pageViews] = await Promise.all([
                        window.supabaseClient.from('user_activity_logs').select('*', { count: 'exact', head: true })
                            .gte('timestamp', date.toISOString()).lt('timestamp', nextDate.toISOString()),
                        window.supabaseClient.from('page_views').select('*', { count: 'exact', head: true })
                            .gte('created_at', date.toISOString()).lt('created_at', nextDate.toISOString())
                    ]);

                    data.push({
                        label: year.toString(),
                        activity: activity.count || 0,
                        pageViews: pageViews.count || 0
                    });
                }
            }

            this.renderBarChart(container, data, ['activity', 'pageViews'], ['#10b981', '#8b5cf6'], ['Activity', 'Page Views']);

        } catch (error) {
            console.error('Error rendering activity trend chart:', error);
            container.innerHTML = '<div style="color: var(--text-secondary); text-align: center;">Failed to load chart</div>';
        }
    }

    /**
     * Render user growth chart (last 12 months)
     */
    async renderUserGrowthChart() {
        const container = document.getElementById('userGrowthChart');
        if (!container || !window.supabaseClient) return;

        try {
            const now = new Date();
            const data = [];

            for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const nextDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);

                const { count } = await window.supabaseClient
                    .from('user_profiles')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', date.toISOString())
                    .lt('created_at', nextDate.toISOString());

                data.push({
                    label: date.toLocaleDateString('en-US', { month: 'short' }),
                    users: count || 0
                });
            }

            this.renderBarChart(container, data, ['users'], ['#3b82f6'], ['New Users']);

        } catch (error) {
            console.error('Error rendering user growth chart:', error);
            container.innerHTML = '<div style="color: var(--text-secondary); text-align: center;">Failed to load chart</div>';
        }
    }

    /**
     * Render page views distribution chart
     */
    async renderPageViewsDistChart() {
        const container = document.getElementById('pageViewsDistChart');
        if (!container || !window.supabaseClient) return;

        try {
            const now = new Date();
            const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
            const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - 7);
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            const [todayViews, weekViews, monthViews] = await Promise.all([
                window.supabaseClient.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
                window.supabaseClient.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', weekStart.toISOString()),
                window.supabaseClient.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString())
            ]);

            const data = [
                { label: 'Today', views: todayViews.count || 0 },
                { label: 'Week', views: weekViews.count || 0 },
                { label: 'Month', views: monthViews.count || 0 }
            ];

            this.renderBarChart(container, data, ['views'], ['#8b5cf6'], ['Page Views']);

        } catch (error) {
            console.error('Error rendering page views chart:', error);
            container.innerHTML = '<div style="color: var(--text-secondary); text-align: center;">Failed to load chart</div>';
        }
    }

    /**
     * Generic bar chart renderer
     */
    renderBarChart(container, data, keys, colors, labels) {
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">No data available</div>';
            return;
        }

        const maxValue = Math.max(...data.flatMap(d => keys.map(k => d[k] || 0)), 1);
        const barWidth = keys.length > 1 ? 20 : 35;
        const chartHeight = container.clientHeight - 60 || 180;

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; height: 100%;">
                <!-- Legend -->
                <div style="display: flex; gap: 15px; margin-bottom: 10px; justify-content: center;">
                    ${keys.map((k, i) => `
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <div style="width: 12px; height: 12px; background: ${colors[i]}; border-radius: 2px;"></div>
                            <span style="font-size: 11px; color: var(--text-secondary);">${labels[i]}</span>
                        </div>
                    `).join('')}
                </div>
                <!-- Chart -->
                <div style="display: flex; align-items: flex-end; justify-content: space-around; flex: 1; padding: 10px 0; border-bottom: 1px solid var(--border-color);">
                    ${data.map(d => `
                        <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
                            <div style="display: flex; gap: 3px; align-items: flex-end; height: ${chartHeight}px;">
                                ${keys.map((k, i) => {
                                    const value = d[k] || 0;
                                    const height = Math.max((value / maxValue) * (chartHeight - 20), 4);
                                    return `
                                        <div style="display: flex; flex-direction: column; align-items: center;">
                                            <div style="font-size: 10px; color: ${colors[i]}; margin-bottom: 2px;">${this.formatNumber(value)}</div>
                                            <div style="background: ${colors[i]}; width: ${barWidth}px; height: ${height}px; border-radius: 3px 3px 0 0; transition: height 0.3s ease;"></div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 8px; text-align: center;">${d.label}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Load currently online users
     */
    async loadOnlineUsers() {
        const container = document.getElementById('onlineUsersList');
        if (!container || !window.supabaseClient) return;

        try {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            
            const { data: sessions, error } = await window.supabaseClient
                .from('user_sessions')
                .select(`
                    id,
                    user_id,
                    current_page,
                    last_seen_at,
                    started_at,
                    user_agent
                `)
                .eq('is_active', true)
                .gte('last_seen_at', fiveMinutesAgo)
                .order('last_seen_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            if (!sessions || sessions.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-secondary);">
                        <i class="fas fa-user-slash" style="font-size: 32px; margin-bottom: 10px; opacity: 0.5;"></i>
                        <p>No users currently online</p>
                    </div>
                `;
                return;
            }

            // Fetch user profiles for online sessions
            const userIds = [...new Set(sessions.filter(s => s.user_id).map(s => s.user_id))];
            let userProfiles = {};
            
            if (userIds.length > 0) {
                const { data: profiles } = await window.supabaseClient
                    .from('user_profiles')
                    .select('user_id, email, display_name, avatar_url')
                    .in('user_id', userIds);
                
                if (profiles) {
                    profiles.forEach(p => userProfiles[p.user_id] = p);
                }
            }

            container.innerHTML = sessions.map(session => {
                const profile = session.user_id ? userProfiles[session.user_id] : null;
                const isAnonymous = !session.user_id;
                const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'Anonymous';
                const avatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
                const sessionDuration = this.getSessionDuration(session.started_at);
                const lastSeen = this.formatTime(session.last_seen_at);
                const device = this.parseUserAgent(session.user_agent);

                return `
                    <div class="online-user-card ${isAnonymous ? 'anonymous' : ''}" ${session.user_id ? `data-user-id="${session.user_id}"` : ''} style="
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px;
                        background: var(--bg-secondary);
                        border-radius: 8px;
                        cursor: ${isAnonymous ? 'default' : 'pointer'};
                        transition: background 0.2s;
                    " ${!isAnonymous ? `onclick="window.adminPanelEnhanced?.showUserActivityModal('${session.user_id}')"` : ''}>
                        <div class="user-avatar" style="position: relative;">
                            <img src="${avatar}" alt="${this.escapeHtml(displayName)}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                            <span class="online-indicator" style="
                                position: absolute;
                                bottom: 0;
                                right: 0;
                                width: 12px;
                                height: 12px;
                                background: #10b981;
                                border: 2px solid var(--bg-secondary);
                                border-radius: 50%;
                            "></span>
                        </div>
                        <div class="user-info" style="flex: 1; min-width: 0;">
                            <div style="font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${this.escapeHtml(displayName)}
                                ${isAnonymous ? '<span class="badge" style="font-size: 10px; margin-left: 5px;">Guest</span>' : ''}
                            </div>
                            <div style="font-size: 11px; color: var(--text-secondary);">
                                ${this.escapeHtml(session.current_page || '/')} • ${sessionDuration}
                            </div>
                            <div style="font-size: 10px; color: var(--text-muted);">
                                ${device}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Failed to load online users:', error);
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-secondary);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 10px; opacity: 0.5;"></i>
                    <p>Failed to load online users</p>
                    <small>Table may not exist yet</small>
                </div>
            `;
        }
    }

    /**
     * Load all users with activity info
     */
    async loadAllUsers() {
        const container = document.getElementById('allUsersList');
        if (!container || !window.supabaseClient) return;

        try {
            // Fetch all user profiles
            const { data: profiles, error } = await window.supabaseClient
                .from('user_profiles')
                .select('user_id, email, display_name, avatar_url, created_at')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            if (!profiles || profiles.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        <i class="fas fa-users-slash" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                        <p>No users found</p>
                    </div>
                `;
                return;
            }

            // Get recent activity counts for users
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);

            // Fetch recent activity counts
            const { data: activityCounts } = await window.supabaseClient
                .from('user_activity_logs')
                .select('user_id')
                .gte('timestamp', yesterday.toISOString());

            const activeUserIds = new Set(activityCounts?.map(a => a.user_id) || []);

            // Store for filtering
            this.allUsersData = profiles.map(profile => ({
                ...profile,
                isActive: activeUserIds.has(profile.user_id),
                isNew: new Date(profile.created_at) > lastWeek
            }));

            this.renderUsersList(this.allUsersData);

        } catch (error) {
            console.error('Failed to load users:', error);
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>Failed to load users</p>
                </div>
            `;
        }
    }

    /**
     * Render users list
     */
    renderUsersList(users) {
        const container = document.getElementById('allUsersList');
        if (!container) return;

        if (!users || users.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <p>No users match the filter</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="users-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: var(--bg-tertiary); text-align: left;">
                        <th style="padding: 12px;">User</th>
                        <th style="padding: 12px;">Email</th>
                        <th style="padding: 12px;">Status</th>
                        <th style="padding: 12px;">Registered</th>
                        <th style="padding: 12px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => {
                        const displayName = user.display_name || user.email?.split('@')[0] || 'Unknown';
                        const avatar = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=32`;
                        
                        return `
                            <tr class="user-activity-card" data-user-id="${user.user_id}" style="border-bottom: 1px solid var(--border-color); cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 12px;">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <img src="${avatar}" alt="${this.escapeHtml(displayName)}" style="width: 32px; height: 32px; border-radius: 50%;">
                                        <span style="font-weight: 500;">${this.escapeHtml(displayName)}</span>
                                    </div>
                                </td>
                                <td style="padding: 12px; color: var(--text-secondary);">${this.escapeHtml(user.email || 'N/A')}</td>
                                <td style="padding: 12px;">
                                    ${user.isActive ? '<span class="badge" style="background: #10b981; color: white;">Active</span>' : ''}
                                    ${user.isNew ? '<span class="badge" style="background: #8b5cf6; color: white; margin-left: 5px;">New</span>' : ''}
                                    ${!user.isActive && !user.isNew ? '<span class="badge" style="background: var(--text-muted); color: white;">Inactive</span>' : ''}
                                </td>
                                <td style="padding: 12px; color: var(--text-secondary);">${new Date(user.created_at).toLocaleDateString()}</td>
                                <td style="padding: 12px;">
                                    <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); window.adminPanelEnhanced?.showUserActivityModal('${user.user_id}')" title="View Activity">
                                        <i class="fas fa-chart-line"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    /**
     * Filter users list
     */
    filterUsersList() {
        if (!this.allUsersData) return;

        const search = (document.getElementById('userActivitySearch')?.value || '').toLowerCase();
        const filter = document.getElementById('userActivityFilter')?.value || 'all';

        let filtered = this.allUsersData;

        // Apply search
        if (search) {
            filtered = filtered.filter(user => 
                (user.display_name || '').toLowerCase().includes(search) ||
                (user.email || '').toLowerCase().includes(search)
            );
        }

        // Apply filter
        if (filter === 'active') {
            filtered = filtered.filter(user => user.isActive);
        } else if (filter === 'new') {
            filtered = filtered.filter(user => user.isNew);
        }

        this.renderUsersList(filtered);
    }

    /**
     * Show user activity modal
     */
    async showUserActivityModal(userId) {
        if (!window.supabaseClient) return;

        // Create modal if it doesn't exist
        let modal = document.getElementById('userActivityModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'userActivityModal';
            modal.className = 'modal-overlay';
            modal.style.cssText = 'display: none; z-index: 10200;';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 900px; max-height: 85vh; overflow: hidden; display: flex; flex-direction: column;">
                    <div class="modal-header">
                        <h2 id="userActivityModalTitle"><i class="fas fa-user-clock"></i> User Activity</h2>
                        <button class="btn-close" onclick="document.getElementById('userActivityModal').style.display='none'">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" id="userActivityModalBody" style="flex: 1; overflow-y: auto;">
                        <div class="loading-placeholder">Loading user activity...</div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });
        }

        // Show modal with loading
        modal.style.display = 'flex';
        const body = document.getElementById('userActivityModalBody');
        body.innerHTML = '<div class="loading-placeholder" style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 32px;"></i><p>Loading user activity...</p></div>';

        try {
            // Fetch user profile
            const { data: profile } = await window.supabaseClient
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            // Fetch detailed activity
            let detailedActivity = [];
            try {
                const { data: activity } = await window.supabaseClient
                    .from('user_activity_detailed')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(100);
                detailedActivity = activity || [];
            } catch (e) {
                console.warn('Could not fetch detailed activity:', e);
            }

            // Fetch basic activity logs
            const { data: activityLogs } = await window.supabaseClient
                .from('user_activity_logs')
                .select('*')
                .eq('user_id', userId)
                .order('timestamp', { ascending: false })
                .limit(100);

            // Fetch sessions
            let sessions = [];
            try {
                const { data: userSessions } = await window.supabaseClient
                    .from('user_sessions')
                    .select('*')
                    .eq('user_id', userId)
                    .order('started_at', { ascending: false })
                    .limit(20);
                sessions = userSessions || [];
            } catch (e) {
                console.warn('Could not fetch sessions:', e);
            }

            // Update modal title
            document.getElementById('userActivityModalTitle').innerHTML = `
                <i class="fas fa-user-clock"></i> Activity: ${this.escapeHtml(profile?.display_name || profile?.email?.split('@')[0] || 'Unknown User')}
            `;

            // Build activity summary
            const activityTypes = {};
            (activityLogs || []).forEach(log => {
                activityTypes[log.activity_type] = (activityTypes[log.activity_type] || 0) + 1;
            });

            const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'Unknown';
            const avatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

            body.innerHTML = `
                <!-- User Header -->
                <div class="user-activity-header" style="display: flex; gap: 20px; align-items: center; padding: 20px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 20px;">
                    <img src="${avatar}" alt="${this.escapeHtml(displayName)}" style="width: 80px; height: 80px; border-radius: 50%;">
                    <div style="flex: 1;">
                        <h3 style="margin: 0;">${this.escapeHtml(displayName)}</h3>
                        <p style="margin: 5px 0; color: var(--text-secondary);">${this.escapeHtml(profile?.email || 'No email')}</p>
                        <div style="display: flex; gap: 10px; margin-top: 10px;">
                            <span class="badge"><i class="fas fa-calendar"></i> Joined ${new Date(profile?.created_at).toLocaleDateString()}</span>
                            ${profile?.discord_username ? `<span class="badge"><i class="fab fa-discord"></i> ${this.escapeHtml(profile.discord_username)}</span>` : ''}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 24px; font-weight: bold; color: var(--accent-primary);">${(activityLogs || []).length}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Total Actions</div>
                    </div>
                </div>

                <!-- Activity Stats -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
                    <div class="stat-card" style="text-align: center; padding: 15px; background: var(--bg-secondary); border-radius: 8px;">
                        <div style="font-size: 24px; font-weight: bold; color: #10b981;">${sessions.length}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Sessions</div>
                    </div>
                    <div class="stat-card" style="text-align: center; padding: 15px; background: var(--bg-secondary); border-radius: 8px;">
                        <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">${activityTypes['template_use'] || 0}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Templates Used</div>
                    </div>
                    <div class="stat-card" style="text-align: center; padding: 15px; background: var(--bg-secondary); border-radius: 8px;">
                        <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${(activityTypes['mob_create'] || 0) + (activityTypes['skill_create'] || 0)}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Creations</div>
                    </div>
                    <div class="stat-card" style="text-align: center; padding: 15px; background: var(--bg-secondary); border-radius: 8px;">
                        <div style="font-size: 24px; font-weight: bold; color: #ef4444;">${activityTypes['export'] || 0}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Exports</div>
                    </div>
                </div>

                <!-- Activity Type Breakdown -->
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px;"><i class="fas fa-chart-pie"></i> Activity Breakdown</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${Object.entries(activityTypes).map(([type, count]) => `
                            <span class="badge" style="padding: 6px 12px;">
                                ${this.getActivityIcon(type)} ${type.replace(/_/g, ' ')}: <strong>${count}</strong>
                            </span>
                        `).join('') || '<span style="color: var(--text-secondary);">No activity recorded</span>'}
                    </div>
                </div>

                <!-- Recent Activity Timeline -->
                <div>
                    <h4 style="margin-bottom: 15px;"><i class="fas fa-history"></i> Recent Activity Timeline</h4>
                    <div class="activity-timeline" style="max-height: 400px; overflow-y: auto;">
                        ${(detailedActivity.length > 0 ? detailedActivity : activityLogs || []).slice(0, 50).map(activity => {
                            const timestamp = activity.created_at || activity.timestamp;
                            const actionType = activity.action_type || activity.activity_type;
                            const actionName = activity.action_name || '';
                            const targetName = activity.target_name || activity.details?.templateName || activity.details?.packName || '';
                            
                            return `
                                <div class="activity-item" style="display: flex; gap: 15px; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                                    <div class="activity-icon" style="width: 36px; height: 36px; border-radius: 50%; background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center;">
                                        ${this.getActivityIcon(actionType)}
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 500;">
                                            ${this.escapeHtml(actionType.replace(/_/g, ' '))}
                                            ${actionName ? ` - ${this.escapeHtml(actionName)}` : ''}
                                        </div>
                                        ${targetName ? `<div style="font-size: 13px; color: var(--text-secondary);">Target: ${this.escapeHtml(targetName)}</div>` : ''}
                                        <div style="font-size: 12px; color: var(--text-muted);">${this.formatTime(timestamp)}</div>
                                    </div>
                                </div>
                            `;
                        }).join('') || '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No activity recorded</p>'}
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('Failed to load user activity:', error);
            body.innerHTML = `
                <div class="error-state" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 15px; color: #ef4444;"></i>
                    <p>Failed to load user activity</p>
                    <small>${error.message}</small>
                </div>
            `;
        }
    }

    /**
     * Get activity icon based on type
     */
    getActivityIcon(type) {
        const icons = {
            'login': '<i class="fas fa-sign-in-alt" style="color: #10b981;"></i>',
            'logout': '<i class="fas fa-sign-out-alt" style="color: #6b7280;"></i>',
            'template_view': '<i class="fas fa-eye" style="color: #3b82f6;"></i>',
            'template_use': '<i class="fas fa-download" style="color: #8b5cf6;"></i>',
            'template_create': '<i class="fas fa-plus-circle" style="color: #10b981;"></i>',
            'template_rate': '<i class="fas fa-star" style="color: #f59e0b;"></i>',
            'search': '<i class="fas fa-search" style="color: #6b7280;"></i>',
            'pack_create': '<i class="fas fa-folder-plus" style="color: #10b981;"></i>',
            'mob_create': '<i class="fas fa-skull" style="color: #ef4444;"></i>',
            'skill_create': '<i class="fas fa-magic" style="color: #8b5cf6;"></i>',
            'item_create': '<i class="fas fa-gem" style="color: #f59e0b;"></i>',
            'export': '<i class="fas fa-file-export" style="color: #3b82f6;"></i>',
            'import': '<i class="fas fa-file-import" style="color: #10b981;"></i>',
            'feature_use': '<i class="fas fa-cogs" style="color: #6b7280;"></i>',
            'auth': '<i class="fas fa-user-shield" style="color: #8b5cf6;"></i>',
            'navigation': '<i class="fas fa-route" style="color: #6b7280;"></i>',
            'ui': '<i class="fas fa-mouse-pointer" style="color: #6b7280;"></i>',
            'editor': '<i class="fas fa-edit" style="color: #3b82f6;"></i>',
            'error': '<i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>'
        };
        return icons[type] || '<i class="fas fa-circle" style="color: #6b7280;"></i>';
    }

    /**
     * Get session duration string
     */
    getSessionDuration(startedAt) {
        const start = new Date(startedAt);
        const now = new Date();
        const diffMs = now - start;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just joined';
        if (diffMins < 60) return `${diffMins}m`;
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m`;
    }

    /**
     * Parse user agent for display
     */
    parseUserAgent(ua) {
        if (!ua) return 'Unknown device';
        
        let browser = 'Browser';
        let os = '';
        
        if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';
        
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
        
        return `${browser}${os ? ' on ' + os : ''}`;
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

    async loadSettings() {
        try {
            // Try to load from database first
            let settings = {};
            if (window.supabaseClient) {
                const { data, error } = await window.supabaseClient
                    .from('system_settings')
                    .select('key, value')
                    .order('key');
                
                if (!error && data) {
                    data.forEach(row => {
                        settings[row.key] = row.value;
                    });
                }
            }
            
            // Fall back to localStorage if no database settings
            if (Object.keys(settings).length === 0) {
                settings = JSON.parse(localStorage.getItem('admin_settings') || '{}');
            }
            
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
            
            // Template limits
            if (settings.maxTemplatesPerUser) {
                document.getElementById('maxTemplatesPerUser').value = settings.maxTemplatesPerUser;
            }
            if (settings.maxPendingTemplatesPerUser) {
                document.getElementById('maxPendingTemplatesPerUser').value = settings.maxPendingTemplatesPerUser;
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }

    async saveSettings() {
        const settings = {
            featureTemplates: document.getElementById('featureTemplates').checked,
            featureSocialSharing: document.getElementById('featureSocialSharing').checked,
            featureAnalytics: document.getElementById('featureAnalytics').checked,
            maintenanceMode: document.getElementById('maintenanceMode').checked,
            maintenanceMessage: document.getElementById('maintenanceMessage').value,
            apiRateLimit: parseInt(document.getElementById('apiRateLimit').value),
            templateRateLimit: parseInt(document.getElementById('templateRateLimit').value),
            maxPackSize: parseInt(document.getElementById('maxPackSize').value),
            maxPacksPerUser: parseInt(document.getElementById('maxPacksPerUser').value),
            maxTemplatesPerUser: parseInt(document.getElementById('maxTemplatesPerUser').value),
            maxPendingTemplatesPerUser: parseInt(document.getElementById('maxPendingTemplatesPerUser').value)
        };

        // Save to localStorage as backup
        localStorage.setItem('admin_settings', JSON.stringify(settings));
        
        // Save to database if available
        if (window.supabaseClient) {
            try {
                // Upsert each setting to database
                for (const [key, value] of Object.entries(settings)) {
                    await window.supabaseClient
                        .from('system_settings')
                        .upsert({
                            key: key,
                            value: value,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'key' });
                }
                
                // Update global settings cache
                window.systemSettings = settings;
                
                window.notificationModal?.alert('Settings saved to database successfully!', 'success', 'Success');
            } catch (error) {
                console.error('Failed to save settings to database:', error);
                window.notificationModal?.alert('Settings saved locally. Database sync failed.', 'warning', 'Partial Save');
            }
        } else {
            window.notificationModal?.alert('Settings saved locally!', 'success', 'Success');
        }
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
    // Store reference globally for onclick handlers
    window.adminPanelEnhanced = null;
}
