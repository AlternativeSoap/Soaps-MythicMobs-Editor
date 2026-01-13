/**
 * Soaps MythicMobs Editor - Main Application
 * Core application class with state management
 * 
 * ═══════════════════════════════════════════════════════════════
 * Created by: AlternativeSoap
 * © 2025 AlternativeSoap - All Rights Reserved
 * 
 * This editor is provided to the MythicMobs community.
 * Please respect the creator's work and give credit where due.
 * ═══════════════════════════════════════════════════════════════
 */

// PERFORMANCE: Global debug mode flag (set to false for production)
window.DEBUG_MODE = true;

class MythicMobsEditor {
    constructor() {
        // Display creator info in console
        console.log('%c═══════════════════════════════════════════════════════════════', 'color: #9b59b6; font-weight: bold;');
        console.log('%c  🎮 Soaps MythicMobs Editor', 'color: #9b59b6; font-size: 16px; font-weight: bold;');
        console.log('%c  Created by: AlternativeSoap', 'color: #8e44ad; font-size: 14px;');
        console.log('%c  © 2025 - Made with 💜 for the MythicMobs community', 'color: #8e44ad;');
        console.log('%c═══════════════════════════════════════════════════════════════', 'color: #9b59b6; font-weight: bold;');
        console.log('');
                console.log('');
        // Core utilities
        this.storage = null;
        this.packManager = null;
        this.fileManager = null;
        this.yamlParser = null;
        this.yamlExporter = null;
        this.validator = null;
        this.history = null;
        
        // Components
        this.mobEditor = null;
        this.skillEditor = null;
        this.itemEditor = null;
        this.droptableEditor = null;
        this.randomspawnEditor = null;
        this.commandPalette = null;
        this.yamlEditor = null;
        this.panelResizer = null;
        
        // Application state
        this.state = {
            currentMode: 'beginner',          // 'beginner', 'advanced', or 'guided'
            currentPack: null,                // Active pack object
            currentFile: null,                // Currently open file
            currentFileType: null,            // 'mob', 'skill', or 'item'
            currentView: 'dashboard',         // Current view name
            isDirty: false,                   // Unsaved changes flag
            hasContentEdits: false,           // True only when user actually edits content (not just creates file)
            autoSave: false,                  // Auto-save disabled by default
            livePreview: true,                // Live YAML preview enabled
            sidebarLeftCollapsed: false,
            sidebarRightCollapsed: false,
            lastSavedTimestamp: null,         // Last successful save timestamp
            cloudDataHash: null,              // Hash of cloud data for conflict detection
            saveProgress: { current: 0, total: 0, currentFile: '' },  // Save progress tracking
            unsavedChangesPopupCount: 0       // Track how many times unsaved changes popup shown
        };
        
        // Change history tracking
        this.changeHistory = [];
        
        // Settings with defaults
        this.defaultSettings = {
            autoSave: false,
            autoSaveInterval: 2000,
            livePreview: true,
            livePreviewDebounce: 300,
            defaultMode: 'beginner',
            animations: true,
            compactMode: false,
            keepHistory: true,
            maxHistory: 100,
            warnDuplicateFiles: true,
            internalNameSeparator: '_',
            delayDisplayMode: 'ticks'
        };
        
        this.settings = { ...this.defaultSettings };
        
        // Auto-save timer
        this.autoSaveTimer = null;
        
        // Preview update timer
        this.previewTimer = null;
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize storage FIRST
            this.storage = new StorageManager();
            
            // Wait for storage auth check to complete
            if (this.storage.db && this.storage.db.checkAuth) {
                await this.storage.db.checkAuth();
            }
            
            // Initialize authentication
            this.authManager = new AuthManager(window.supabaseClient);
            await this.authManager.checkInitialAuth();
            
            // Initialize authentication UI
            this.authUI = new AuthUI(this.authManager, this.storage);
            
            // Load settings
            this.loadSettings();
            
            // Apply default mode from settings BEFORE loading files
            this.state.currentMode = this.settings.defaultMode;
            document.body.setAttribute('data-mode', this.state.currentMode);
            
            // ============================================
            // MOBILE SUPPORT INITIALIZATION
            // Initialize mobile manager early to set device attributes
            // ============================================
            if (typeof MobileManager !== 'undefined') {
                this.mobileManager = new MobileManager();
                this.mobileManager.init(this); // Pass editor reference
                
                console.log(`📱 Device: ${this.mobileManager.deviceType}, Touch: ${this.mobileManager.isTouchDevice}`);
                
                // Initialize mobile skill wizard on mobile/tablet OR touch devices OR when mobileMode is active
                // This ensures the wizard is available when needed, even if initial detection was wrong
                const shouldInitMobileWizard = this.mobileManager.isMobile || 
                                                this.mobileManager.isTablet || 
                                                this.mobileManager.state?.mobileMode ||
                                                this.mobileManager.isTouchDevice;
                                                
                if (shouldInitMobileWizard && typeof MobileSkillWizard !== 'undefined') {
                    this.mobileSkillWizard = new MobileSkillWizard();
                    console.log('📱 Mobile skill wizard initialized');
                }
            }
            
            // Initialize pack manager
            this.packManager = new PackManager(this);
            
            // Initialize file manager
            this.fileManager = new FileManager(this);
            
            // Initialize YAML utilities
            this.yamlParser = new YAMLParser();
            this.yamlExporter = new YAMLExporter();
            
            // Initialize validator
            this.validator = new Validator();
            
            // Initialize history
            this.history = new EditorHistory(this);
            
            // Initialize YAML editor
            this.yamlEditor = new YAMLEditor(this);
            
            // Initialize panel resizer
            this.panelResizer = new PanelResizer();
            this.panelResizer.init();
            
            // Initialize components
            this.mobEditor = new MobEditor(this);
            this.skillEditor = new SkillEditor(this);
            this.itemEditor = new ItemEditor(this);
            this.droptableEditor = new DropTableEditor(this);
            this.randomspawnEditor = new RandomSpawnEditor(this);
            this.statsEditor = new StatsEditor(this);
            this.commandPalette = new CommandPalette(this);
            
            // Initialize guided mode wizard
            if (window.GuidedModeWizard) {
                this.guidedModeWizard = new GuidedModeWizard(this);
            }
            
            // Initialize pack tools
            this.dependencyGraph = new DependencyGraph(this);
            this.packStatistics = new PackStatistics(this);
            this.duplicateDetector = new DuplicateDetector(this);
            this.packValidator = new PackValidator(this);
            this.skillUsageReport = new SkillUsageReport(this);
            this.backupManager = new BackupManager(this);
            
            window.dependencyGraph = this.dependencyGraph; // Make globally accessible
            
            // Load packs (now userId should be set)
            await this.packManager.loadPacks();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Render initial UI
            this.render();
            
        } catch (error) {
            console.error('❌ Failed to initialize editor:', error);
            this.showToast('Failed to initialize editor', 'error');
        }
    }
    
    /**
     * Load settings from storage
     */
    loadSettings() {
        const saved = this.storage.get('settings');
        if (saved) {
            this.settings = { ...this.defaultSettings, ...saved };
        }
        
        // Apply settings to UI
        this.applySettings();
    }
    
    /**
     * Save settings to storage
     */
    saveSettings() {
        this.storage.set('settings', this.settings);
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Mode switcher
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const isMobile = document.body.dataset.device === 'mobile' || document.body.classList.contains('mobile-mode');
                const isActive = btn.classList.contains('active');

                // Prevent switching to the same mode when clicking the active button (no-op)
                if (isActive) {
                    e.stopPropagation();
                    e.preventDefault();
                    return;
                }

                // Also prevent default when active button is a mobile dropdown trigger
                if ((isMobile && window.mobileManager && window.mobileManager.state?.mobileMode) || e.currentTarget.getAttribute('data-mode-dropdown') === 'true') {
                    if (e.currentTarget.getAttribute('data-mode-dropdown') === 'true') {
                        e.stopPropagation();
                        e.preventDefault();
                        return;
                    }
                }

                const mode = e.currentTarget.dataset.mode;
                this.switchMode(mode);
            });
        });
        
        // Mode comparison triggers
        document.getElementById('mode-difference-btn')?.addEventListener('click', () => this.showModeComparison());
        document.querySelectorAll('.mode-info-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent mode switch
                this.showModeComparison();
            });
        });
        
        // Mode comparison modal close
        document.getElementById('close-mode-comparison')?.addEventListener('click', () => this.closeModeComparison());
        document.getElementById('mode-comparison-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'mode-comparison-modal') {
                this.closeModeComparison();
            }
        });
        
        // Quick actions
        document.getElementById('quick-new-mob')?.addEventListener('click', () => this.createNewMob());
        document.getElementById('quick-new-skill')?.addEventListener('click', () => this.createNewSkill());
        document.getElementById('quick-new-item')?.addEventListener('click', () => this.createNewItem());
        document.getElementById('quick-new-droptable')?.addEventListener('click', () => this.createNewDropTable());
        document.getElementById('quick-new-randomspawn')?.addEventListener('click', () => this.createNewRandomSpawn());
        document.getElementById('quick-new-spawner')?.addEventListener('click', () => this.createNewSpawner());
        document.getElementById('quick-placeholder-browser')?.addEventListener('click', () => this.openPlaceholderBrowser());
        document.getElementById('quick-template-browser')?.addEventListener('click', () => this.openTemplateBrowser());
        document.getElementById('quick-stats-editor')?.addEventListener('click', () => this.showStatsEditor(false));
        document.getElementById('quick-import')?.addEventListener('click', () => this.showImportDialog());
        
        // Pack actions
        document.getElementById('new-pack-btn')?.addEventListener('click', () => this.createNewPack());
        document.getElementById('import-pack-btn')?.addEventListener('click', () => this.importPack());
        
        // Breadcrumb home button
        document.getElementById('breadcrumb-home')?.addEventListener('click', () => this.goToDashboard());
        
        // Save actions
        document.getElementById('save-all-btn')?.addEventListener('click', async () => {
            try {
                await this.saveAll();
            } catch (error) {
                console.error('Save all failed:', error);
            }
        });
        document.getElementById('dropdown-save-all-btn')?.addEventListener('click', async () => {
            try {
                await this.saveAll();
                // Close dropdown after save
                document.getElementById('recent-changes-dropdown')?.classList.add('hidden');
            } catch (error) {
                console.error('Save all failed:', error);
            }
        });
        document.getElementById('save-status')?.addEventListener('click', (e) => { e._saveStatusHandled = true; this.toggleRecentChanges(e); });
        document.getElementById('view-all-changes-btn')?.addEventListener('click', () => this.showChangeHistory());
        document.getElementById('close-history-modal')?.addEventListener('click', () => this.closeChangeHistory());
        document.getElementById('clear-history-btn')?.addEventListener('click', () => this.clearChangeHistory());
        document.getElementById('history-search')?.addEventListener('input', (e) => this.filterChangeHistory(e.target.value));
        
        // Click outside to close recent changes dropdown
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('recent-changes-dropdown');
            const saveStatusContainer = document.querySelector('.save-status-container');
            if (dropdown && !dropdown.classList.contains('hidden') && 
                !dropdown.contains(e.target) && (!saveStatusContainer || !saveStatusContainer.contains(e.target))) {
                dropdown.classList.add('hidden');
            }
        });
        
        // Click modal background to close
        document.getElementById('change-history-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'change-history-modal') {
                this.closeChangeHistory();
            }
        });
        
        // YAML actions
        document.getElementById('copy-yaml-btn')?.addEventListener('click', () => this.copyYAML());
        document.getElementById('export-yaml-btn')?.addEventListener('click', () => this.exportYAML());
        
        // Sidebar toggles
        document.getElementById('toggle-left-sidebar')?.addEventListener('click', () => this.toggleLeftSidebar());
        document.getElementById('toggle-right-sidebar')?.addEventListener('click', () => this.toggleRightSidebar());
        document.getElementById('expand-left-sidebar')?.addEventListener('click', () => this.toggleLeftSidebar());
        document.getElementById('expand-right-sidebar')?.addEventListener('click', () => this.toggleRightSidebar());
        
        // Settings
        document.getElementById('settings-btn')?.addEventListener('click', () => this.showSettings());
        document.getElementById('close-settings-modal')?.addEventListener('click', () => this.closeSettings());
        document.getElementById('save-settings-btn')?.addEventListener('click', () => this.saveSettingsFromModal());
        document.getElementById('reset-settings-btn')?.addEventListener('click', () => this.resetSettings());
        document.getElementById('help-btn')?.addEventListener('click', () => this.showHelp());
        
        // Tools dropdown
        document.getElementById('tools-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleToolsDropdown();
        });
        
        // Tools dropdown items
        document.querySelectorAll('.tools-dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                this.closeToolsDropdown();
                this.openTool(tool);
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const toolsMenu = document.querySelector('.tools-menu');
            if (toolsMenu && !toolsMenu.contains(e.target)) {
                this.closeToolsDropdown();
            }
        });
        
        // Settings tabs
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchSettingsTab(tabName);
            });
        });
        
        // Settings modal background click
        document.getElementById('settings-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'settings-modal') {
                this.closeSettings();
            }
        });
        
        // Range slider live updates
        document.getElementById('setting-autosave-interval')?.addEventListener('input', (e) => {
            document.getElementById('autosave-interval-value').textContent = e.target.value + 's';
        });
        document.getElementById('setting-preview-delay')?.addEventListener('input', (e) => {
            document.getElementById('preview-delay-value').textContent = e.target.value + 'ms';
        });
        document.getElementById('setting-max-history')?.addEventListener('input', (e) => {
            document.getElementById('max-history-value').textContent = e.target.value;
        });
        
        // Delay display mode - update immediately when changed
        document.getElementById('setting-delay-display-mode')?.addEventListener('change', (e) => {
            this.settings.delayDisplayMode = e.target.value;
            this.saveSettings();
            
            // Re-render skill builder if it exists to show updated delay annotations
            if (this.skillEditor?.skillBuilderEditor) {
                this.skillEditor.skillBuilderEditor.render();
            }
            
            // Re-render mob skills editor if it exists
            if (this.mobEditor?.skillsEditor) {
                this.mobEditor.skillsEditor.render();
            }
        });
        
        // Note: Modal overlay click handler is attached per-modal in createModal()
        
        // Close command palette on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.commandPalette?.hide();
                this.closeContextMenu();
            }
        });
        
        // View all shortcuts button
        document.getElementById('view-all-shortcuts')?.addEventListener('click', () => {
            this.showAllShortcuts();
        });
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', async (e) => {
            // Skip if user is typing in input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Command Palette (Ctrl+K)
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.commandPalette?.show();
            }
            
            // Save (Ctrl+S)
            if (e.ctrlKey && !e.shiftKey && e.key === 's') {
                e.preventDefault();
                try {
                    await this.save();
                } catch (error) {
                    console.error('Save failed:', error);
                }
            }
            
            // Save All (Ctrl+Shift+S)
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                try {
                    await this.saveAll();
                } catch (error) {
                    console.error('Save all failed:', error);
                }
            }
            
            // New Mob (Ctrl+N)
            if (e.ctrlKey && !e.shiftKey && e.key === 'n') {
                e.preventDefault();
                this.createNewMob();
            }
            
            // New Skill (Ctrl+Shift+M)
            if (e.ctrlKey && e.shiftKey && e.key === 'M') {
                e.preventDefault();
                this.createNewSkill();
            }
            
            // New Item (Ctrl+Shift+I)
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                this.createNewItem();
            }
            
            // New DropTable (Ctrl+Shift+T)
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.createNewDropTable();
            }
            
            // Dependency Graph (Ctrl+Shift+D)
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.showDependencyGraph();
            }
            
            // New RandomSpawn (Ctrl+Shift+R)
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                this.createNewRandomSpawn();
            }
            
            // New Spawner (Ctrl+Shift+S) - but not if it's save
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.createNewSpawner();
            }
            
            // Placeholder Browser (Ctrl+Shift+H)
            if (e.ctrlKey && e.shiftKey && e.key === 'H') {
                e.preventDefault();
                this.openPlaceholderBrowser();
            }
            
            // Stats Editor (Ctrl+Shift+A) - Advanced mode only
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                if (this.state.currentMode === 'advanced') {
                    this.showStatsEditor(true);
                }
            }
            
            // Template Browser (Ctrl+Shift+P)
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                this.openTemplateBrowser();
            }
            
            // Import YAML (Ctrl+Shift+O)
            if (e.ctrlKey && e.shiftKey && e.key === 'O') {
                e.preventDefault();
                this.showImportDialog();
            }
            
            // Export (Ctrl+E)
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                this.exportYAML();
            }
            
            // Import (Ctrl+I)
            if (e.ctrlKey && e.key === 'i') {
                e.preventDefault();
                this.showImportDialog();
            }
            
            // Undo (Ctrl+Z)
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.history?.undo();
            }
            
            // Redo (Ctrl+Y or Ctrl+Shift+Z)
            if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
                e.preventDefault();
                this.history?.redo();
            }
            
            // Toggle left sidebar (Ctrl+B)
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                this.toggleLeftSidebar();
            }
            
            // Duplicate current item (Ctrl+D)
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.duplicateCurrentItem();
            }
            
            // Return to dashboard (ESC)
            if (e.key === 'Escape' && this.state.currentView !== 'dashboard') {
                e.preventDefault();
                this.goToDashboard();
            }
        });
    }
    
    /**
     * Duplicate the currently open item (Ctrl+D shortcut)
     */
    duplicateCurrentItem() {
        if (!this.state.currentFile || !this.state.currentFileType) {
            this.showToast('No item open to duplicate', 'warning');
            return;
        }
        
        // Call the appropriate editor's duplicate method
        switch (this.state.currentFileType) {
            case 'mob':
                this.mobEditor?.duplicateMob();
                break;
            case 'skill':
                this.skillEditor?.duplicateSkill();
                break;
            case 'item':
                this.itemEditor?.duplicateItem();
                break;
            case 'droptable':
                this.droptableEditor?.duplicateDropTable(this.state.currentFile);
                break;
            case 'randomspawn':
                this.randomspawnEditor?.duplicateRandomSpawn();
                break;
            default:
                this.showToast('Cannot duplicate this item type', 'warning');
        }
    }
    
    /**
     * Return to dashboard view
     */
    goToDashboard() {
        // Hide all editor views - reset both class and inline styles
        document.querySelectorAll('.view-container').forEach(view => {
            view.classList.remove('active');
            view.style.display = ''; // Reset any inline display styles
        });
        
        // Clear spawner state if we were viewing spawner
        if (this.state.currentView === 'spawner') {
            this.state.currentSpawnerFile = null;
        }
        
        // Show appropriate dashboard based on mode
        if (this.state.currentMode === 'guided') {
            this.showGuidedDashboard();
        } else {
            const dashboardView = document.getElementById('dashboard-view');
            if (dashboardView) {
                dashboardView.classList.add('active');
            }
        }
        
        // Update state
        this.state.currentView = 'dashboard';
        this.state.currentFile = null;
        this.state.currentFileType = null;
        
        // Dispatch view change event for mobile manager
        document.dispatchEvent(new CustomEvent('viewchange', { 
            detail: { view: 'dashboard', type: null, file: null }
        }));
        
        // Update breadcrumb
        this.updateBreadcrumb();
        
        // Hide home button when on dashboard
        const homeBtn = document.getElementById('breadcrumb-home');
        if (homeBtn) {
            homeBtn.style.display = 'none';
        }
        
        // Update pack tree to clear active states
        if (this.packManager) {
            this.packManager.renderPackTree();
        }
    }
    
    /**
     * Show guided mode dashboard
     */
    showGuidedDashboard() {
        // Hide all views first
        document.querySelectorAll('.view-container').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show guided dashboard
        const guidedDashboard = document.getElementById('guided-mode-dashboard');
        if (guidedDashboard) {
            guidedDashboard.classList.add('active');
            this.renderGuidedDashboard();
        }
    }
    
    /**
     * Render the guided dashboard content
     */
    renderGuidedDashboard() {
        const container = document.getElementById('guided-mode-dashboard');
        if (!container) return;
        
        container.innerHTML = `
            <div class="guided-dashboard">
                <div class="guided-dashboard-header">
                    <h1><i class="fas fa-wand-magic-sparkles"></i> Guided Mode</h1>
                    <p>Create amazing custom mobs with step-by-step wizards</p>
                </div>
                
                <div class="guided-create-grid">
                    <div class="guided-create-card card-mob" id="guided-create-mob">
                        <div class="guided-create-card-icon">
                            <i class="fas fa-skull"></i>
                        </div>
                        <h3>Create a Mob</h3>
                        <p>Use our step-by-step wizard to create a custom mob with skills, stats, and abilities</p>
                    </div>
                    
                    <div class="guided-create-card card-skill" id="guided-create-skill">
                        <div class="guided-create-card-icon">
                            <i class="fas fa-magic"></i>
                        </div>
                        <h3>Create a Skill</h3>
                        <p>Design powerful skill mechanics with visual builders and preset templates</p>
                    </div>
                    
                    <div class="guided-create-card card-item" id="guided-create-item">
                        <div class="guided-create-card-icon">
                            <i class="fas fa-gem"></i>
                        </div>
                        <h3>Create an Item</h3>
                        <p>Build custom items with enchantments, lore, and special abilities</p>
                    </div>
                    
                    <div class="guided-create-card card-droptable" id="guided-create-droptable">
                        <div class="guided-create-card-icon">
                            <i class="fas fa-dice"></i>
                        </div>
                        <h3>Create a Drop Table</h3>
                        <p>Configure loot drops with chances, conditions, and rewards</p>
                    </div>
                </div>
                
                <div class="guided-tips-section" style="margin-top: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border-primary);">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; color: var(--accent-primary);">
                        <i class="fas fa-lightbulb"></i> Getting Started
                    </h3>
                    <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem;">
                        <li style="display: flex; align-items: flex-start; gap: 0.75rem; color: var(--text-secondary);">
                            <i class="fas fa-check-circle" style="color: var(--success); margin-top: 0.2rem;"></i>
                            <span>Click <strong>"Create a Mob"</strong> to start the step-by-step wizard</span>
                        </li>
                        <li style="display: flex; align-items: flex-start; gap: 0.75rem; color: var(--text-secondary);">
                            <i class="fas fa-check-circle" style="color: var(--success); margin-top: 0.2rem;"></i>
                            <span>Choose from pre-built templates or customize every option</span>
                        </li>
                        <li style="display: flex; align-items: flex-start; gap: 0.75rem; color: var(--text-secondary);">
                            <i class="fas fa-check-circle" style="color: var(--success); margin-top: 0.2rem;"></i>
                            <span>Add powerful skills with just a few clicks</span>
                        </li>
                        <li style="display: flex; align-items: flex-start; gap: 0.75rem; color: var(--text-secondary);">
                            <i class="fas fa-check-circle" style="color: var(--success); margin-top: 0.2rem;"></i>
                            <span>Switch to Beginner or Advanced mode anytime for more control</span>
                        </li>
                    </ul>
                </div>
            </div>
        `;
        
        // Attach event listeners
        this.attachGuidedDashboardListeners();
    }
    
    /**
     * Attach guided dashboard event listeners
     */
    attachGuidedDashboardListeners() {
        document.getElementById('guided-create-mob')?.addEventListener('click', () => {
            this.openGuidedMobWizard();
        });
        
        document.getElementById('guided-create-skill')?.addEventListener('click', () => {
            this.createNewSkill();
        });
        
        document.getElementById('guided-create-item')?.addEventListener('click', () => {
            this.createNewItem();
        });
        
        document.getElementById('guided-create-droptable')?.addEventListener('click', () => {
            this.createNewDropTable();
        });
    }
    
    /**
     * Open the guided mode mob wizard
     */
    openGuidedMobWizard() {
        // Check if we have a pack
        if (!this.state.currentPack) {
            // Try to create or select a pack first
            this.showSelectOrCreatePackDialog().then(pack => {
                if (pack) {
                    this.state.currentPack = pack;
                    this.packManager.setActivePack(pack);
                    this.guidedModeWizard?.open(pack.id);
                }
            });
        } else {
            this.guidedModeWizard?.open(this.state.currentPack.id);
        }
    }
    
    /**
     * Show dialog to select or create a pack
     */
    async showSelectOrCreatePackDialog() {
        return new Promise((resolve) => {
            const packs = this.packManager?.packs || [];
            
            if (packs.length === 0) {
                // No packs exist, create one
                this.showPrompt('Create Pack', 'Enter a name for your new pack:', 'My Pack').then(async name => {
                    if (name) {
                        const pack = await this.packManager.createPack(name);
                        if (pack) {
                            this.packManager.renderPackTree();
                            resolve(pack);
                        } else {
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                });
            } else if (packs.length === 1) {
                // Only one pack, use it
                resolve(packs[0]);
            } else {
                // Multiple packs, show selection
                const packOptions = packs.map(p => ({ text: p.name, value: p.id }));
                packOptions.push({ text: '+ Create New Pack', value: 'new' });
                
                this.showConfirmDialog(
                    'Which pack would you like to add your mob to?',
                    'Select Pack',
                    packOptions
                ).then(async result => {
                    if (result === 'new') {
                        const name = await this.showPrompt('Create Pack', 'Enter a name for your new pack:', 'My Pack');
                        if (name) {
                            const pack = await this.packManager.createPack(name);
                            if (pack) {
                                this.packManager.renderPackTree();
                                resolve(pack);
                            } else {
                                resolve(null);
                            }
                        } else {
                            resolve(null);
                        }
                    } else if (result) {
                        const pack = packs.find(p => p.id === result);
                        resolve(pack || null);
                    } else {
                        resolve(null);
                    }
                });
            }
        });
    }
    
    /**
     * Render the UI
     */
    render() {
        // Render pack tree
        this.packManager?.renderPackTree();
        
        // Update breadcrumb
        this.updateBreadcrumb();
        
        // Update YAML preview
        this.updateYAMLPreview();
    }
    
    /**
     * Switch editor mode
     */
    async switchMode(mode) {
        const wasBeginnerMode = this.state.currentMode === 'beginner';
        const wasGuidedMode = this.state.currentMode === 'guided';
        this.state.currentMode = mode;
        
        // Set data-mode attribute on body for CSS mode-specific styling
        document.body.setAttribute('data-mode', mode);
        
        // Update save-status title based on mode
        const saveStatus = document.getElementById('save-status');
        if (saveStatus) {
            if (mode === 'advanced') {
                saveStatus.setAttribute('title', 'Click to view recent changes');
                saveStatus.style.cursor = 'pointer';
            } else {
                saveStatus.setAttribute('title', 'All changes saved');
                saveStatus.style.cursor = 'default';
            }
        }
        
        // Set flag to collapse advanced sections when switching from beginner to advanced
        if (wasBeginnerMode && mode === 'advanced') {
            this.state.justSwitchedToAdvanced = true;
        }
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Handle guided mode dashboard visibility
        const guidedDashboard = document.getElementById('guided-mode-dashboard');
        const normalDashboard = document.getElementById('dashboard-view');
        
        if (mode === 'guided') {
            // Show guided dashboard, hide normal dashboard
            if (guidedDashboard) guidedDashboard.classList.add('active');
            if (normalDashboard && !this.state.currentFile) normalDashboard.classList.remove('active');
            
            // Go to guided dashboard if no file is open
            if (!this.state.currentFile) {
                this.showGuidedDashboard();
            }
        } else {
            // Hide guided dashboard
            if (guidedDashboard) guidedDashboard.classList.remove('active');
            
            // Show normal dashboard if coming from guided mode and no file open
            if (wasGuidedMode && !this.state.currentFile) {
                if (normalDashboard) normalDashboard.classList.add('active');
            }
        }
        
        // Re-render current editor
        if (this.state.currentFile) {
            this.openFile(this.state.currentFile, this.state.currentFileType);
        }
        
        // Re-render pack tree to show/hide advanced-only items (like stats.yml)
        if (this.packManager) {
            this.packManager.renderPackTree();
        }
        
        // Format mode name nicely
        const modeNames = { beginner: 'Beginner', advanced: 'Advanced', guided: 'Guided' };
        this.showToast(`Switched to ${modeNames[mode] || mode} mode`, 'info');
    }
    
    /**
     * Create new pack
     */
    async createNewPack() {
        // Close any open dropdowns first
        if (this.packManager && this.packManager.closeAllDropdowns) {
            this.packManager.closeAllDropdowns();
        }
        
        // Wait a moment for dropdown to close visually
        await new Promise(resolve => setTimeout(resolve, 100));
        
        let packName = null;
        let attempts = 0;
        const funMessages = [
            "Oops! That pack name is already taken. Let's be original! 🎨",
            "Nice try, but that name's already in use! How about something unique? 🌟",
            "Whoa there! We already have a pack with that name. Be creative! 🎭",
            "Duplicate detected! Channel your inner creativity and try again! 🚀",
            "That name's taken! Time to unleash your imagination! 💡"
        ];
        
        while (!packName) {
            const inputName = await this.showPrompt('New Pack', 'Enter pack name:', 'My Pack');
            if (!inputName) {
                // User cancelled - show celebration message
                this.showCelebrationMessage('Pack creation cancelled! No worries, create one when you\'re ready! 🎊');
                return;
            }
            
            // Check if pack name already exists
            const exists = this.packManager.packs.some(p => p.name === inputName);
            if (exists) {
                const message = funMessages[attempts % funMessages.length];
                // Show cancellation message with fireworks for duplicate
                this.showCelebrationMessage(message);
                return; // Stop - don't ask again
            }
            
            packName = inputName;
        }
        
        const pack = await this.packManager.createPack(packName);
        if (pack) {
            // Select the newly created pack
            this.packManager.setActivePack(pack);
            this.state.currentPack = pack;
            
            // Render the pack tree to show the new pack
            this.packManager.renderPackTree();
            
            // Open packinfo.yml by default
            this.openFile({ type: 'packinfo', data: pack.packinfo }, 'packinfo');
            
            this.showToast('Pack created successfully! 🎉', 'success');
        }
    }
    
    /**
     * Create new mob - shows dialog with template options
     */
    async createNewMob() {
        if (!this.state.currentPack) {
            this.showToast('Please select a pack first', 'warning');
            return;
        }
        
        // Get available template mobs from current pack
        const availableTemplates = this.getAvailableMobTemplates();
        
        // Show enhanced creation dialog
        const result = await this.showMobCreationDialog(availableTemplates);
        if (!result) return;
        
        const { name, template, isTemplate, fileName } = result;
        
        const mob = this.fileManager.createMob(name, { template, isTemplate, fileName });
        this.openFile(mob, 'mob');
        // Note: Don't call markDirty() - file creation already sets isNew:true/modified:true
        
        if (template) {
            this.showToast(`Created "${name}" using template "${template}"`, 'success');
        } else if (isTemplate) {
            this.showToast(`Created template mob "${name}"`, 'success');
        } else {
            this.showToast(`Created mob "${name}"`, 'success');
        }
    }
    
    /**
     * Get list of available mobs that can be used as templates
     */
    getAvailableMobTemplates() {
        if (!this.state.currentPack || !this.state.currentPack.mobs) return [];
        
        const templates = [];
        this.state.currentPack.mobs.forEach(file => {
            if (file.entries && Array.isArray(file.entries)) {
                file.entries.forEach(mob => {
                    if (mob.name) {
                        templates.push({
                            name: mob.name,
                            type: mob.type || 'Unknown',
                            isTemplate: mob.isTemplate || false,
                            hasTemplate: !!mob.template
                        });
                    }
                });
            } else if (file.name) {
                templates.push({
                    name: file.name,
                    type: file.type || 'Unknown',
                    isTemplate: file.isTemplate || false,
                    hasTemplate: !!file.template
                });
            }
        });
        
        return templates;
    }
    
    /**
     * Show mob creation dialog with template options
     */
    showMobCreationDialog(availableTemplates) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal mob-creation-modal">
                    <div class="modal-header">
                        <h3><i class="fas fa-skull"></i> Create New Mob</h3>
                        <button class="modal-close" id="close-mob-dialog">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">YAML File Name <span class="required">*</span></label>
                            <input type="text" class="form-input" id="new-mob-filename" placeholder="mobs" autofocus>
                            <small class="form-hint">Name of the YAML file (without .yml extension)</small>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Mob Section Name</label>
                            <input type="text" class="form-input" id="new-mob-name" placeholder="Auto-generated" disabled>
                            <small class="form-hint">Section name will be auto-generated (editable in the editor)</small>
                        </div>
                        
                        <div class="creation-type-selector" style="margin: 1.5rem 0;">
                            <label class="form-label" style="margin-bottom: 0.75rem; display: block;">Creation Type</label>
                            <div class="creation-type-options" style="display: flex; gap: 0.5rem;">
                                <button type="button" class="creation-type-btn active" data-type="standalone" style="
                                    flex: 1; padding: 1rem; border: 2px solid var(--border-primary); border-radius: 0.5rem;
                                    background: var(--bg-primary); cursor: pointer; text-align: center; transition: all 0.2s;
                                ">
                                    <i class="fas fa-cube" style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;"></i>
                                    <strong>Standalone</strong>
                                    <small style="display: block; color: var(--text-tertiary); margin-top: 0.25rem;">Regular mob</small>
                                </button>
                                <button type="button" class="creation-type-btn" data-type="template" style="
                                    flex: 1; padding: 1rem; border: 2px solid var(--border-primary); border-radius: 0.5rem;
                                    background: var(--bg-primary); cursor: pointer; text-align: center; transition: all 0.2s;
                                ">
                                    <i class="fas fa-layer-group" style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;"></i>
                                    <strong>Template</strong>
                                    <small style="display: block; color: var(--text-tertiary); margin-top: 0.25rem;">Base for other mobs</small>
                                </button>
                                <button type="button" class="creation-type-btn" data-type="child" style="
                                    flex: 1; padding: 1rem; border: 2px solid var(--border-primary); border-radius: 0.5rem;
                                    background: var(--bg-primary); cursor: pointer; text-align: center; transition: all 0.2s;
                                ">
                                    <i class="fas fa-sitemap" style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;"></i>
                                    <strong>Child Mob</strong>
                                    <small style="display: block; color: var(--text-tertiary); margin-top: 0.25rem;">Inherits from template</small>
                                </button>
                            </div>
                        </div>
                        
                        <div id="template-selector-section" style="display: none; margin-top: 1rem;">
                            <label class="form-label">Parent Template <span class="required">*</span></label>
                            <select class="form-select" id="parent-template-select">
                                <option value="">-- Select a template --</option>
                                ${availableTemplates.length > 0 ? 
                                    availableTemplates.map(t => `
                                        <option value="${t.name}" ${t.isTemplate ? 'data-is-template="true"' : ''}>
                                            ${t.name} (${t.type})${t.isTemplate ? ' ⭐ Template' : ''}${t.hasTemplate ? ' → Uses template' : ''}
                                        </option>
                                    `).join('') : 
                                    '<option value="" disabled>No mobs available in pack</option>'
                                }
                            </select>
                            <small class="form-hint">Select the mob to inherit properties from</small>
                        </div>
                        
                        <div class="creation-info" style="
                            margin-top: 1rem; padding: 1rem; background: var(--bg-tertiary); 
                            border-radius: 0.5rem; border-left: 3px solid var(--accent-primary);
                        ">
                            <p id="creation-info-text" style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">
                                <i class="fas fa-info-circle"></i> 
                                Create a regular standalone mob with all properties defined.
                            </p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancel-mob-dialog">Cancel</button>
                        <button class="btn btn-primary" id="confirm-mob-dialog">
                            <i class="fas fa-plus"></i> Create Mob
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            // Focus on filename input
            setTimeout(() => document.getElementById('new-mob-filename')?.focus(), 100);
            
            let selectedType = 'standalone';
            
            // Type selector logic
            overlay.querySelectorAll('.creation-type-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    overlay.querySelectorAll('.creation-type-btn').forEach(b => {
                        b.classList.remove('active');
                        b.style.borderColor = 'var(--border-primary)';
                        b.style.background = 'var(--bg-primary)';
                    });
                    btn.classList.add('active');
                    btn.style.borderColor = 'var(--accent-primary)';
                    btn.style.background = 'var(--accent-primary-light)';
                    
                    selectedType = btn.dataset.type;
                    const templateSection = document.getElementById('template-selector-section');
                    const infoText = document.getElementById('creation-info-text');
                    
                    if (selectedType === 'child') {
                        templateSection.style.display = 'block';
                        infoText.innerHTML = '<i class="fas fa-sitemap"></i> This mob will inherit all properties from the selected template. You can override specific properties.';
                    } else {
                        templateSection.style.display = 'none';
                        if (selectedType === 'template') {
                            infoText.innerHTML = '<i class="fas fa-layer-group"></i> This mob will serve as a base template. Other mobs can inherit from it.';
                        } else {
                            infoText.innerHTML = '<i class="fas fa-info-circle"></i> Create a regular standalone mob with all properties defined.';
                        }
                    }
                });
            });
            
            // Set initial active state styling
            const activeBtn = overlay.querySelector('.creation-type-btn.active');
            if (activeBtn) {
                activeBtn.style.borderColor = 'var(--accent-primary)';
                activeBtn.style.background = 'var(--accent-primary-light)';
            }
            
            const cleanup = () => {
                document.body.removeChild(overlay);
            };
            
            document.getElementById('close-mob-dialog').addEventListener('click', () => {
                cleanup();
                resolve(null);
            });
            
            document.getElementById('cancel-mob-dialog').addEventListener('click', () => {
                cleanup();
                resolve(null);
            });
            
            document.getElementById('confirm-mob-dialog').addEventListener('click', () => {
                const fileName = document.getElementById('new-mob-filename').value.trim();
                if (!fileName) {
                    this.showToast('Please enter a file name', 'warning');
                    return;
                }
                
                // Auto-generate section name
                const name = 'mob_' + Date.now();
                const fullFileName = fileName.endsWith('.yml') ? fileName : fileName + '.yml';
                
                if (selectedType === 'child') {
                    const template = document.getElementById('parent-template-select').value;
                    if (!template) {
                        this.showToast('Please select a parent template', 'warning');
                        return;
                    }
                    cleanup();
                    resolve({ name, template, isTemplate: false, fileName: fullFileName });
                } else {
                    cleanup();
                    resolve({ name, template: '', isTemplate: selectedType === 'template', fileName: fullFileName });
                }
            });
            
            // Enter key to confirm
            document.getElementById('new-mob-filename').addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('confirm-mob-dialog').click();
                }
            });
            
            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    cleanup();
                    resolve(null);
                }
            });
        });
    }
    
    /**
     * Create new skill - shows dialog with template option
     */
    async createNewSkill() {
        if (!this.state.currentPack) {
            this.showToast('Please select a pack first', 'warning');
            return;
        }
        
        // Show creation choice dialog
        const result = await this.showSkillCreationDialog();
        if (!result) return;
        
        if (result.useTemplate) {
            // Open template browser for skill creation
            this.openTemplateBrowser();
        } else {
            // Create empty skill file
            const fullFileName = result.fileName.endsWith('.yml') ? result.fileName : result.fileName + '.yml';
            this.fileManager.createEmptyFile('skill', fullFileName);
            this.showToast('Skill file created. Add skills using the + button in the editor.', 'success');
            // Note: Don't call markDirty() - file creation already sets isNew:true/modified:true
        }
    }
    
    /**
     * Show skill creation dialog - template or empty
     */
    showSkillCreationDialog() {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay skill-creation-overlay';
            overlay.innerHTML = `
                <div class="modal skill-creation-modal">
                    <div class="skill-creation-header">
                        <h3><i class="fas fa-magic"></i> Create New Skill</h3>
                        <button class="modal-close" id="close-skill-dialog">&times;</button>
                    </div>
                    <div class="skill-creation-body">
                        <p class="creation-subtitle">How would you like to create your skill?</p>
                        
                        <div class="creation-type-options">
                            <button type="button" class="creation-choice-btn choice-template" data-choice="template">
                                <div class="choice-icon template-icon">
                                    <i class="fas fa-box-open"></i>
                                </div>
                                <strong>From Template</strong>
                                <small>Pre-made skill lines or<br>multiple skill sections</small>
                            </button>
                            <button type="button" class="creation-choice-btn choice-empty" data-choice="empty">
                                <div class="choice-icon empty-icon">
                                    <i class="fas fa-file-alt"></i>
                                </div>
                                <strong>Empty File</strong>
                                <small>Start from scratch</small>
                            </button>
                        </div>
                        
                        <div id="empty-file-section" class="empty-file-section">
                            <div class="form-group">
                                <label class="form-label">YAML File Name <span class="required">*</span></label>
                                <input type="text" class="form-input" id="new-skill-filename" placeholder="skills">
                                <small class="form-hint">Name of the YAML file (without .yml extension)</small>
                            </div>
                        </div>
                    </div>
                    <div class="skill-creation-footer" id="skill-dialog-footer">
                        <button class="btn btn-secondary" id="cancel-skill-dialog">Cancel</button>
                        <button class="btn btn-primary" id="confirm-skill-dialog">
                            <i class="fas fa-plus"></i> Create File
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.classList.add('active'));
            
            const cleanup = () => {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 150);
            };
            
            // Choice button logic
            overlay.querySelectorAll('.creation-choice-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const choice = btn.dataset.choice;
                    if (choice === 'template') {
                        cleanup();
                        resolve({ useTemplate: true });
                    } else {
                        document.getElementById('empty-file-section').classList.add('visible');
                        document.getElementById('skill-dialog-footer').classList.add('visible');
                        document.getElementById('new-skill-filename')?.focus();
                        overlay.querySelector('.creation-type-options').style.display = 'none';
                        overlay.querySelector('.creation-subtitle').style.display = 'none';
                    }
                });
            });
            
            document.getElementById('close-skill-dialog').addEventListener('click', () => {
                cleanup();
                resolve(null);
            });
            
            document.getElementById('cancel-skill-dialog').addEventListener('click', () => {
                cleanup();
                resolve(null);
            });
            
            document.getElementById('confirm-skill-dialog').addEventListener('click', () => {
                const fileName = document.getElementById('new-skill-filename').value.trim();
                if (!fileName) {
                    this.showToast('Please enter a file name', 'warning');
                    return;
                }
                cleanup();
                resolve({ useTemplate: false, fileName });
            });
            
            document.getElementById('new-skill-filename')?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('confirm-skill-dialog').click();
                }
            });
            
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    cleanup();
                    resolve(null);
                }
            });
        });
    }
    
    /**
     * Create new item
     */
    async createNewItem() {
        if (!this.state.currentPack) {
            this.showToast('Please select a pack first', 'warning');
            return;
        }
        
        const fileName = await this.showPrompt('New Item File', 'Enter YAML file name (without .yml):', 'items');
        if (!fileName) return;
        
        // Add .yml extension if not present
        const fullFileName = fileName.endsWith('.yml') ? fileName : fileName + '.yml';
        
        // Create empty file (no entries yet)
        this.fileManager.createEmptyFile('item', fullFileName);
        this.showToast('Item file created. Add items using the + button in the editor.', 'success');
        // Note: Don't call markDirty() - file creation already sets isNew:true/modified:true
    }
    
    /**
     * Create new droptable
     */
    async createNewDropTable() {
        if (!this.state.currentPack) {
            this.showToast('Please select a pack first', 'warning');
            return;
        }
        
        const fileName = await this.showPrompt('New DropTable File', 'Enter YAML file name (without .yml):', 'droptables');
        if (!fileName) return;
        
        // Add .yml extension if not present
        const fullFileName = fileName.endsWith('.yml') ? fileName : fileName + '.yml';
        
        // Create empty file (no entries yet)
        this.fileManager.createEmptyFile('droptable', fullFileName);
        this.showToast('DropTable file created. Add droptables using the + button in the editor.', 'success');
        // Note: Don't call markDirty() - file creation already sets isNew:true/modified:true
    }
    
    /**
     * Create new randomspawn
     */
    async createNewRandomSpawn() {
        if (!this.state.currentPack) {
            this.showToast('Please select a pack first', 'warning');
            return;
        }
        
        const fileName = await this.showPrompt('New RandomSpawn File', 'Enter YAML file name (without .yml):', 'randomspawns');
        if (!fileName) return;
        
        // Add .yml extension if not present
        const fullFileName = fileName.endsWith('.yml') ? fileName : fileName + '.yml';
        
        // Create empty file (no entries yet)
        this.fileManager.createEmptyFile('randomspawn', fullFileName);
        this.showToast('RandomSpawn file created. Add spawns using the + button in the editor.', 'success');
        // Note: Don't call markDirty() - file creation already sets isNew:true/modified:true
    }
    
    /**
     * Create new spawner file
     */
    async createNewSpawner() {
        if (!this.state.currentPack) {
            this.showToast('Please select a pack first', 'warning');
            return;
        }
        
        const fileName = await this.showPrompt('New Spawner File', 'Enter YAML file name (without .yml):', 'spawners');
        if (!fileName) return;
        
        // Add .yml extension if not present
        const fullFileName = fileName.endsWith('.yml') ? fileName : fileName + '.yml';
        
        // Create empty file and switch to spawner view
        if (!this.state.currentPack.spawners) {
            this.state.currentPack.spawners = {};
        }
        
        // Create a spawner file entry
        if (!this.state.currentPack.spawnerFiles) {
            this.state.currentPack.spawnerFiles = {};
        }
        this.state.currentPack.spawnerFiles[fullFileName] = {
            modified: true,
            isNew: true
        };
        
        // Also store in global spawner files for consistency
        if (!window.globalSpawnerFiles) {
            window.globalSpawnerFiles = {};
        }
        window.globalSpawnerFiles[fullFileName] = this.state.currentPack.spawnerFiles[fullFileName];
        
        // Refresh file tree to show new spawner file
        if (this.packManager) {
            this.packManager.renderPackTree();
        }
        
        // Switch to spawner editor view
        this.showSpawnerEditor(fullFileName);
        this.showToast('Spawner file created. Configure your spawner settings.', 'success');
    }
    
    /**
     * Show spawner editor view
     */
    showSpawnerEditor(fileName) {
        // Update state
        this.state.currentView = 'spawner';
        this.state.currentSpawnerFile = fileName;
        
        // Dispatch view change event for mobile manager
        document.dispatchEvent(new CustomEvent('viewchange', { 
            detail: { view: 'spawner', type: 'spawner', file: fileName }
        }));
        
        // Hide all views - use consistent approach with class toggle AND style reset
        document.querySelectorAll('.view-container').forEach(v => {
            v.classList.remove('active');
            v.style.display = ''; // Reset any inline display styles
        });
        
        // Show spawner view using the class system
        const spawnerView = document.getElementById('spawner-editor-view');
        if (spawnerView) {
            spawnerView.classList.add('active');
            
            // Initialize spawner editor if not already
            if (!this.spawnerEditor) {
                this.spawnerEditor = new SpawnerEditor(this);
            }
            
            // Load spawner data if editing existing
            let spawnerData = null;
            if (fileName) {
                spawnerData = window.globalSpawnerFiles?.[fileName] || 
                             this.state.currentPack?.spawnerFiles?.[fileName] || 
                             null;
            }
            
            // Render the editor
            spawnerView.innerHTML = '';
            const editorContainer = this.spawnerEditor.render(spawnerData);
            spawnerView.appendChild(editorContainer);
            this.spawnerEditor.attachEventListeners(editorContainer);
        }
        
        // Update breadcrumb
        this.updateBreadcrumb('Spawner', fileName);
        
        // Update pack tree to show active spawner
        if (this.packManager) {
            this.packManager.renderPackTree();
        }
    }
    
    /**
     * Create new stat or open stats file
     */
    createNewStat() {
        if (!this.state.currentPack) {
            this.showToast('Please select a pack first', 'warning');
            return;
        }
        
        // Initialize stats file if it doesn't exist
        if (!this.state.currentPack.stats) {
            this.state.currentPack.stats = {
                id: 'stats_' + Date.now(),
                fileName: 'stats.yml',
                entries: [],
                modified: true,
                isNew: true
            };
        }
        
        // Show stats editor with create dialog
        this.showStatsEditor(true);
    }
    
    /**
     * Show stats editor view
     */
    showStatsEditor(showCreateDialog = false) {
        const pack = this.state.currentPack;
        if (!pack) return;
        
        // Ensure stats object exists (create empty one if needed)
        if (!pack.stats) {
            pack.stats = {
                id: 'stats_' + Date.now(),
                fileName: 'stats.yml',
                entries: [],
                modified: false,
                isNew: true
            };
        }
        
        // Update state
        this.state.currentView = 'stats';
        this.state.currentFile = pack.stats;
        this.state.currentFileType = 'stats';
        
        // Dispatch view change event for mobile manager
        document.dispatchEvent(new CustomEvent('viewchange', { 
            detail: { view: 'stats', type: 'stats', file: pack.stats }
        }));
        
        // Hide all views
        document.querySelectorAll('.view-container').forEach(v => {
            v.classList.remove('active');
            v.style.display = '';
        });
        
        // Show stats view
        const statsView = document.getElementById('stats-editor-view');
        
        if (statsView) {
            statsView.classList.add('active');
            
            // Create file container object for the stats file
            const fileContainer = {
                id: 'stats_container',
                _isFileContainer: true,
                _fileId: pack.stats.id,
                _fileName: 'stats.yml',
                _file: pack.stats,
                name: 'stats.yml',
                fileName: 'stats.yml',
                entries: pack.stats.entries || []
            };
            
            // Render the stats editor
            if (this.statsEditor) {
                this.statsEditor.render(fileContainer);
            }
            
            // Show create dialog if requested
            if (showCreateDialog) {
                setTimeout(() => {
                    this.statsEditor.showCreateStatDialog();
                }, 100);
            }
        }
        
        // Update breadcrumb
        this.updateBreadcrumb('Stats', 'stats.yml');
        
        // Update pack tree to show stats.yml as active
        if (this.packManager) {
            this.packManager.renderPackTree();
        }
        
        // Update YAML preview with stats content
        this.updateYAMLPreview();
    }
    
    /**
     * Open Placeholder Browser
     */
    openPlaceholderBrowser(callback) {
        if (window.placeholderBrowser) {
            window.placeholderBrowser.show(callback);
        } else {
            // Initialize if not ready
            window.placeholderBrowser = new PlaceholderBrowser();
            setTimeout(() => {
                window.placeholderBrowser.show(callback);
            }, 100);
        }
    }
    
    /**
     * Open Template Browser for creating new skills from templates
     * This is a first-class entry point for template-based creation
     */
    async openTemplateBrowser() {
        if (!this.state.currentPack) {
            this.showToast('Please select a pack first', 'warning');
            return;
        }
        
        // Initialize template selector if needed
        if (!window.templateSelector) {
            const templateManager = window.templateManager || new TemplateManager(window.authManager);
            const templateEditor = window.templateEditor;
            window.templateSelector = new TemplateSelector(templateManager, templateEditor);
        }
        
        // Open template browser in "creation" mode
        window.templateSelector.openForCreation({
            context: 'skill', // Default to skill context for creation
            onSelect: (template) => this.createFromTemplate(template),
            onCancel: () => {
                console.log('Template browser closed without selection');
            }
        });
    }
    
    /**
     * Create new skill file(s) from a template
     * Handles single-line, multi-line, and multi-section templates
     */
    async createFromTemplate(template) {
        if (!template) {
            this.showToast('No template selected', 'warning');
            return;
        }
        
        console.log('Creating from template:', template.name, template);
        
        // Determine template structure
        const sections = template.sections || [];
        const skillLines = template.skillLines || [];
        const isMultiSection = sections.length > 1;
        const isSingleLine = !isMultiSection && (sections.length === 0 || (sections[0]?.lines?.length || 0) <= 1) && skillLines.length <= 1;
        
        // Get file name from user
        const defaultName = template.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
        const fileName = await this.showPrompt(
            `Create from "${template.name}"`,
            'Enter skill file name (without .yml):',
            defaultName
        );
        
        if (!fileName) return;
        
        const fullFileName = fileName.endsWith('.yml') ? fileName : fileName + '.yml';
        
        // Build skill data based on template structure
        let skillData = {};
        
        if (isMultiSection) {
            // Multi-section template: create multiple skill entries
            sections.forEach(section => {
                const skillName = section.name || 'UnnamedSkill';
                skillData[skillName] = {
                    Skills: (section.lines || []).map(line => line.trim()).filter(l => l)
                };
            });
            
            this.showToast(`Created ${Object.keys(skillData).length} skills from "${template.name}"`, 'success');
        } else if (sections.length === 1) {
            // Single section with multiple lines
            const section = sections[0];
            const skillName = section.name || fileName.replace('.yml', '');
            skillData[skillName] = {
                Skills: (section.lines || []).map(line => line.trim()).filter(l => l)
            };
            
            this.showToast(`Created skill "${skillName}" from template`, 'success');
        } else if (skillLines.length > 0) {
            // Legacy format: skillLines array
            const skillName = fileName.replace('.yml', '');
            skillData[skillName] = {
                Skills: skillLines.map(line => line.trim()).filter(l => l)
            };
            
            this.showToast(`Created skill "${skillName}" from template`, 'success');
        } else {
            // Empty or single-line template
            const skillName = fileName.replace('.yml', '');
            const singleLine = template.skillLine || (skillLines[0] || '');
            skillData[skillName] = {
                Skills: singleLine ? [singleLine.trim()] : []
            };
            
            this.showToast(`Created skill "${skillName}" from template`, 'success');
        }
        
        // Create the file with populated data
        this.fileManager.createFileWithData('skill', fullFileName, skillData);
        // Note: Don't call markDirty() here - the file is created with isNew:true/modified:true
        // which is tracked separately. markDirty() should only be called when user makes actual edits.
        
        // Open the newly created file
        const newFile = this.fileManager.findFile(fullFileName, 'skill');
        if (newFile) {
            // For multi-section templates, open the first entry (skill) directly
            // For single-section, also open the first entry
            if (newFile.entries && newFile.entries.length > 0) {
                // Use findEntryById to get a properly normalized entry
                const firstEntry = this.packManager.findEntryById(
                    newFile.entries[0].id, 
                    'skill', 
                    newFile.id
                );
                if (firstEntry) {
                    this.openFile(firstEntry, 'skill');
                }
            } else {
                // Fallback: create file container view
                const fileContainer = {
                    id: `container_${newFile.id}`,
                    _isFileContainer: true,
                    _fileId: newFile.id,
                    _fileName: newFile.fileName,
                    _file: newFile,
                    name: newFile.fileName,
                    fileName: newFile.fileName
                };
                this.openFile(fileContainer, 'skill');
            }
        }
    }
    
    /**
     * Open a file in the editor
     */
    async openFile(file, type) {
        // Only show unsaved changes dialog if user has made actual content edits
        // (not just created a new file without editing it)
        if (this.state.hasContentEdits && !this.settings.autoSave && this.state.currentFile) {
            // Increment popup counter for EVERY popup shown
            this.state.unsavedChangesPopupCount++;
            
            // After 3 popups, show enhanced auto-save suggestion
            if (this.state.unsavedChangesPopupCount >= 3) {
                const enableAutoSave = await this.showAutoSaveSuggestionModal();
                if (enableAutoSave) {
                    // Enable auto-save and save current changes
                    this.settings.autoSave = true;
                    this.saveSettings();
                    this.applySettings();
                    
                    // Update the settings UI checkbox if it exists
                    const autoSaveCheckbox = document.getElementById('setting-autosave');
                    if (autoSaveCheckbox) autoSaveCheckbox.checked = true;
                    
                    this.showToast('✅ Auto-save enabled! Your work will be saved automatically.', 'success');
                    
                    // Save current changes immediately using saveAll to clear all modified flags
                    try {
                        await this.saveAll();
                    } catch (error) {
                        console.error('Failed to save after enabling auto-save:', error);
                    }
                    
                    // Reset counter only when auto-save is enabled
                    this.state.unsavedChangesPopupCount = 0;
                    
                    // Continue with navigation (auto-save is now on)
                    // Fall through to the rest of openFile
                } else {
                    // User declined auto-save - show normal dialog
                    // DON'T reset counter - it will trigger again on next popup
                    
                    // Show normal unsaved changes dialog
                    const choice = await this.showConfirmDialog('Unsaved changes', 'You have unsaved changes. What would you like to do?', [
                        { text: 'Save & Continue', value: 'save', primary: true },
                        { text: 'Discard & Continue', value: 'discard' },
                        { text: 'Cancel', value: 'cancel' }
                    ]);
                    
                    if (choice === 'cancel' || choice === false || choice === null) {
                        return; // Abort navigation
                    }
                    
                    if (choice === 'save') {
                        try {
                            // Use saveAll() to properly clear all modified flags
                            await this.saveAll();
                        } catch (error) {
                            console.error('Save failed while attempting to navigate:', error);
                            this.showToast('Save failed. Navigation cancelled.', 'error');
                            return;
                        }
                    } else if (choice === 'discard') {
                        // Clear all modified flags when discarding
                        this.clearAllModifiedFlags();
                        this.state.isDirty = false;
                        this.state.hasContentEdits = false;
                        this.updateSaveStatusIndicator();
                    }
                }
            } else {
                // Show normal unsaved changes dialog (popup count < 3)
                const choice = await this.showConfirmDialog('Unsaved changes', 'You have unsaved changes. What would you like to do?', [
                    { text: 'Save & Continue', value: 'save', primary: true },
                    { text: 'Discard & Continue', value: 'discard' },
                    { text: 'Cancel', value: 'cancel' }
                ]);

                if (choice === 'cancel' || choice === false || choice === null) {
                    return; // Abort navigation
                }

                if (choice === 'save') {
                    // Use saveAll() to properly save and clear all modified flags
                    try {
                        await this.saveAll();
                    } catch (error) {
                        console.error('Save failed while attempting to navigate:', error);
                        this.showToast('Save failed. Navigation cancelled.', 'error');
                        return;
                    }
                } else if (choice === 'discard') {
                    // Clear all modified flags when discarding
                    this.clearAllModifiedFlags();
                    this.state.isDirty = false;
                    this.state.hasContentEdits = false;
                    this.updateSaveStatusIndicator();
                }
            }
        }

        // Save current file if dirty and auto-save is enabled
        if (this.state.hasContentEdits && this.settings.autoSave && this.state.currentFile) {
            try {
                await this.save();
            } catch (error) {
                console.error('Failed to auto-save before switching files:', error);
            }
        }

        // Update state - clear content edits flag since we're opening a new file
        this.state.currentFile = file;
        this.state.currentFileType = type;
        this.state.currentView = `${type}-editor`;
        this.state.hasContentEdits = false; // Reset for new file - no edits made yet
        this.state.isDirty = false; // Reset dirty flag for new file
        
        // Dispatch view change event for mobile manager and other listeners
        document.dispatchEvent(new CustomEvent('viewchange', { 
            detail: { view: this.state.currentView, type: type, file: file }
        }));
        
        // Add to recent files
        if (file && file.id && type !== 'packinfo' && type !== 'tooltips') {
            const fileName = file.internalName || file.name || 'Unnamed';
            const packName = this.state.currentPack?.name || 'Unknown Pack';
            this.packManager.addToRecentFiles(file.id, fileName, type, packName);
        }
        
        // Clear spawner state if we were viewing spawner
        if (this.state.currentSpawnerFile) {
            this.state.currentSpawnerFile = null;
        }
        
        // Hide all views - reset both class and inline styles
        document.querySelectorAll('.view-container').forEach(view => {
            view.classList.remove('active');
            view.style.display = ''; // Reset any inline display styles
        });
        
        // Show appropriate editor
        let editor;
        let viewId;
        
        switch (type) {
            case 'mob':
                editor = this.mobEditor;
                viewId = 'mob-editor-view';
                break;
            case 'skill':
                editor = this.skillEditor;
                viewId = 'skill-editor-view';
                break;
            case 'item':
                editor = this.itemEditor;
                viewId = 'item-editor-view';
                break;
            case 'droptable':
                editor = this.droptableEditor;
                viewId = 'droptable-editor-view';
                break;
            case 'randomspawn':
                editor = this.randomspawnEditor;
                viewId = 'randomspawn-editor-view';
                break;
            case 'stat':
                editor = this.statsEditor;
                viewId = 'stats-editor-view';
                break;
            case 'packinfo':
                // PackInfo uses packManager directly
                viewId = 'packinfo-editor-view';
                break;
        }
        
        if (viewId) {
            const viewElement = document.getElementById(viewId);
            if (viewElement) {
                viewElement.classList.add('active');
                if (editor) {
                    editor.render(file);
                } else if (type === 'packinfo') {
                    // PackInfo rendering is handled by packManager
                    this.packManager.renderPackInfoEditor();
                }
            }
        }
        
        // Update breadcrumb
        this.updateBreadcrumb();
        
        // Update YAML preview
        this.updateYAMLPreview();
        
        // Update file tree to show active file (with small delay to ensure DOM is ready)
        setTimeout(() => {
            this.packManager.updateActiveFileInTree();
        }, 50);
        
        // Clear dirty flag and update status
        this.state.isDirty = false;
        this.updateSaveStatusIndicator();
    }
    
    /**
     * Save current file
     */
    async save() {
        if (!this.state.currentFile) {
            this.showToast('No file is currently open', 'warning');
            return;
        }
        
        // Check if file actually has changes
        if (!this.state.currentFile.modified && !this.state.currentFile.isNew) {
            this.showToast('No changes to save', 'info');
            return;
        }
        
        const fileName = this.state.currentFile.name || 'file';
        
        try {
            this.showSavingStatus();
            
            if (window.DEBUG_MODE) console.log(`💾 Saving file: ${fileName} (${this.state.currentFileType})`);
            
            // Save with retry logic
            let saveSuccess = false;
            let retryCount = 0;
            const maxRetries = 3;
            
            while (!saveSuccess && retryCount < maxRetries) {
                try {
                    await this.fileManager.saveFile(this.state.currentFile, this.state.currentFileType, true); // true = immediate save
                    saveSuccess = true;
                    if (window.DEBUG_MODE) console.log(`✅ Save successful on attempt ${retryCount + 1}`);
                } catch (error) {
                    retryCount++;
                    if (retryCount >= maxRetries) {
                        throw error;
                    }
                    if (window.DEBUG_MODE) console.warn(`⚠️ Save attempt ${retryCount} failed, retrying...`, error);
                    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
                }
            }
            
            // Mark as saved
            this.state.currentFile.modified = false;
            this.state.currentFile.isNew = false;
            this.state.currentFile.lastSaved = new Date().toISOString();
            
            // Only clear isDirty and hasContentEdits if no other files are modified
            const hasOtherModifiedFiles = this.hasModifiedFiles();
            this.state.isDirty = hasOtherModifiedFiles;
            this.state.hasContentEdits = hasOtherModifiedFiles;
            
            this.updateSaveStatusIndicator();
            this.packManager.refresh(); // Refresh tree to remove asterisk
            this.showToast(`✅ Saved ${fileName}`, 'success');
            
        } catch (error) {
            console.error('❌ Failed to save file:', error);
            this.showToast(`❌ Failed to save ${fileName}: ${error.message || 'Unknown error'}`, 'error');
            this.updateSaveStatusIndicator();
        }
    }
    
    /**
     * Save current file (wrapper for editor components)
     * This is called by individual editors (mob, skill, item, etc.)
     */
    async saveCurrentFile() {
        return await this.save();
    }
    
    /**
     * Check if any files are modified across all types
     */
    hasModifiedFiles() {
        if (!this.state.currentPack) return false;
        
        const fileTypes = ['mobs', 'skills', 'items', 'droptables', 'randomspawns'];
        
        for (const type of fileTypes) {
            const files = this.state.currentPack[type] || [];
            if (Array.isArray(files) && files.some(file => this.fileHasUnsavedChanges(file))) {
                return true;
            }
        }
        
        // Also check stats container
        const statsFile = this.state.currentPack.stats;
        if (this.fileHasUnsavedChanges(statsFile)) return true;
        
        // Also check spawner files
        const spawnerFiles = this.state.currentPack.spawnerFiles || {};
        for (const fileName of Object.keys(spawnerFiles)) {
            if (this.fileHasUnsavedChanges(spawnerFiles[fileName])) {
                return true;
            }
        }
        
        // Check global spawner files
        if (window.globalSpawnerFiles) {
            for (const fileName of Object.keys(window.globalSpawnerFiles)) {
                if (this.fileHasUnsavedChanges(window.globalSpawnerFiles[fileName])) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Get count of modified files
     */
    getModifiedFileCount() {
        let count = 0;
        
        // Count pack files if pack is loaded
        if (this.state.currentPack) {
            const fileTypes = ['mobs', 'skills', 'items', 'droptables', 'randomspawns'];
            
            fileTypes.forEach(type => {
                const files = this.state.currentPack[type] || [];
                if (Array.isArray(files)) {
                    count += files.filter(file => this.fileHasUnsavedChanges(file)).length;
                }
            });
            
            // Also count stats container
            const statsFile = this.state.currentPack.stats;
            if (this.fileHasUnsavedChanges(statsFile)) count++;
            
            // Also count spawner files in pack
            const spawnerFiles = this.state.currentPack.spawnerFiles || {};
            for (const fileName of Object.keys(spawnerFiles)) {
                if (this.fileHasUnsavedChanges(spawnerFiles[fileName])) {
                    count++;
                }
            }
        }
        
        // Count global spawner files
        if (window.globalSpawnerFiles) {
            for (const fileName of Object.keys(window.globalSpawnerFiles)) {
                if (this.fileHasUnsavedChanges(window.globalSpawnerFiles[fileName])) {
                    count++;
                }
            }
        }
        
        return count;
    }

    /**
     * Determine if a file has unsaved changes (modified entries or new file)
     * Returns true when file should be considered by Save All
     */
    fileHasUnsavedChanges(file) {
        if (!file) return false;
        if (file.isNew) return true;
        if (file.modified) return true;
        if (Array.isArray(file.entries)) {
            return file.entries.some(e => e && (e.modified || e.isNew));
        }
        return false;
    }
    
    /**
     * Clear modified flags on all files in the current pack
     * Used when discarding changes
     */
    clearAllModifiedFlags() {
        if (!this.state.currentPack) return;
        
        const fileTypes = ['mobs', 'skills', 'items', 'droptables', 'randomspawns', 'spawners'];
        
        fileTypes.forEach(type => {
            const files = this.state.currentPack[type] || [];
            if (Array.isArray(files)) {
                files.forEach(file => {
                    if (file) {
                        file.modified = false;
                        file.isNew = false;
                        file.lastModified = undefined;
                        // Also clear entry-level flags
                        if (Array.isArray(file.entries)) {
                            file.entries.forEach(entry => {
                                if (entry) {
                                    entry.modified = false;
                                    entry.isNew = false;
                                    entry.lastModified = undefined;
                                }
                            });
                        }
                    }
                });
            }
        });
        
        // Clear stats
        if (this.state.currentPack.stats) {
            this.state.currentPack.stats.modified = false;
            this.state.currentPack.stats.isNew = false;
        }
        
        // Clear spawner files object
        const spawnerFiles = this.state.currentPack.spawnerFiles || {};
        for (const fileName of Object.keys(spawnerFiles)) {
            if (spawnerFiles[fileName]) {
                spawnerFiles[fileName].modified = false;
                spawnerFiles[fileName].isNew = false;
            }
        }
        
        // Clear global spawner files
        if (window.globalSpawnerFiles) {
            for (const fileName of Object.keys(window.globalSpawnerFiles)) {
                if (window.globalSpawnerFiles[fileName]) {
                    window.globalSpawnerFiles[fileName].modified = false;
                    window.globalSpawnerFiles[fileName].isNew = false;
                }
            }
        }
        
        // Refresh tree to reflect cleared state
        if (this.packManager && typeof this.packManager.renderPackTree === 'function') {
            this.packManager.renderPackTree();
        }
    }
    
    /**
     * Get list of all modified files (for the dropdown)
     */
    getModifiedFilesList() {
        const modifiedFiles = [];
        
        // Get pack files if pack is loaded
        if (this.state.currentPack) {
            const fileTypes = ['mobs', 'skills', 'items', 'droptables', 'randomspawns'];
            
            fileTypes.forEach(type => {
                const files = this.state.currentPack[type] || [];
                files.filter(file => this.fileHasUnsavedChanges(file)).forEach(file => {
                    modifiedFiles.push({
                        type: type.slice(0, -1), // Remove 's' from type
                        name: file.fileName || file.internalName || file.name || 'Unnamed',
                        file: file,
                        icon: this.getFileTypeIcon(type.slice(0, -1)),
                        isNew: file.isNew,
                        entryCount: file.entries?.length || 0,
                        lastModified: file.lastModified
                    });
                });
            });
            
            // Also include stats file if modified
            const statsFile = this.state.currentPack.stats;
            if (this.fileHasUnsavedChanges(statsFile)) {
                modifiedFiles.push({
                    type: 'stat',
                    name: statsFile.fileName || 'stats.yml',
                    file: statsFile,
                    icon: 'fas fa-chart-line',
                    isNew: statsFile.isNew,
                    entryCount: statsFile.entries?.length || 0,
                    lastModified: statsFile.lastModified
                });
            }

            // Also get spawner files in pack
            const spawnerFiles = this.state.currentPack.spawnerFiles || {};
            for (const fileName of Object.keys(spawnerFiles)) {
                if (this.fileHasUnsavedChanges(spawnerFiles[fileName])) {
                    modifiedFiles.push({
                        type: 'spawner',
                        name: fileName,
                        file: spawnerFiles[fileName],
                        icon: 'fas fa-map-marker-alt',
                        isNew: spawnerFiles[fileName].isNew,
                        lastModified: spawnerFiles[fileName].lastModified
                    });
                }
            }
            
            // Also check spawners array (may be object or array depending on data)
            const spawnersData = this.state.currentPack.spawners;
            const spawnersArray = Array.isArray(spawnersData) ? spawnersData : [];
            spawnersArray.filter(s => this.fileHasUnsavedChanges(s)).forEach(spawner => {
                // Avoid duplicates if already in spawnerFiles
                const alreadyAdded = modifiedFiles.some(m => m.type === 'spawner' && m.name === spawner.fileName);
                if (!alreadyAdded) {
                    modifiedFiles.push({
                        type: 'spawner',
                        name: spawner.fileName || 'Unnamed Spawner',
                        file: spawner,
                        icon: 'fas fa-map-marker-alt',
                        isNew: spawner.isNew,
                        lastModified: spawner.lastModified
                    });
                }
            });
        }
        
        // Get global spawner files
        if (window.globalSpawnerFiles) {
            for (const fileName of Object.keys(window.globalSpawnerFiles)) {
                if (this.fileHasUnsavedChanges(window.globalSpawnerFiles[fileName])) {
                    // Avoid duplicates
                    const alreadyAdded = modifiedFiles.some(m => m.type === 'spawner' && m.name === fileName);
                    if (!alreadyAdded) {
                        modifiedFiles.push({
                            type: 'spawner',
                            name: fileName,
                            file: window.globalSpawnerFiles[fileName],
                            icon: 'fas fa-map-marker-alt',
                            isNew: window.globalSpawnerFiles[fileName].isNew,
                            lastModified: window.globalSpawnerFiles[fileName].lastModified
                        });
                    }
                }
            }
        }
        
        return modifiedFiles;
    }
    
    /**
     * Get icon class for file type
     */
    getFileTypeIcon(type) {
        const icons = {
            'mob': 'fas fa-skull',
            'skill': 'fas fa-magic',
            'item': 'fas fa-gem',
            'droptable': 'fas fa-box-open',
            'randomspawn': 'fas fa-dice',
            'spawner': 'fas fa-map-marker-alt'
        };
        return icons[type] || 'fas fa-file';
    }
    
    /**
     * Mark current state as dirty (unsaved changes)
     */
    markDirty() {
        this.state.isDirty = true;
        this.state.hasContentEdits = true; // User made actual content changes
        
        // Mark current file/entry as modified for Save All
        if (this.state.currentFile) {
            this.state.currentFile.modified = true;
            this.state.currentFile.lastModified = new Date().toISOString();
            
            // IMPORTANT: If this is an entry within a file, also mark the parent file as modified
            // This ensures Save All works correctly for items, droptables, etc.
            if (this.state.currentFile._parentFile && this.state.currentPack) {
                const parentFileId = this.state.currentFile._parentFile.id;
                const fileType = this.state.currentFileType + 's'; // e.g., 'item' -> 'items'
                const collection = this.state.currentPack[fileType];
                
                if (collection) {
                    const parentFile = collection.find(f => f.id === parentFileId);
                    if (parentFile) {
                        parentFile.modified = true;
                        parentFile.lastModified = new Date().toISOString();
                    }
                }
            }
            
            // Also mark _originalEntry if it exists (for file-based structure entries)
            if (this.state.currentFile._originalEntry) {
                this.state.currentFile._originalEntry.modified = true;
                this.state.currentFile._originalEntry.lastModified = new Date().toISOString();
            }
        }
        
        // Add to change history if enabled
        if (this.settings.keepHistory && this.state.currentFile) {
            this.addToChangeHistory({
                fileName: this.state.currentFile.name || this.state.currentFile.internalName,
                fileType: this.state.currentFileType,
                changeType: this.state.currentFile.isNew ? 'created' : 'modified'
            });
        }
        
        this.updateSaveStatusIndicator();
        
        // Schedule auto-save ONLY if enabled in settings
        // Auto-save saves ALL modified files, not just the current one
        if (this.settings.autoSave && this.state.currentFile) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = setTimeout(async () => {
                if (this.settings.autoSave) { // Double-check setting hasn't changed
                    try {
                        await this.saveAll(true); // true = silent mode (no notifications)
                    } catch (error) {
                        console.error('Auto-save failed:', error);
                    }
                }
            }, this.settings.autoSaveInterval);
        }
        
        // Schedule preview update if enabled
        if (this.settings.livePreview) {
            clearTimeout(this.previewTimer);
            this.previewTimer = setTimeout(() => {
                this.updateYAMLPreview();
            }, this.settings.livePreviewDebounce);
        }
    }
    
    /**
     * Update save status indicator based on dirty state
     * Also updates the sync indicator and dropdown
     */
    updateSaveStatusIndicator() {
        const status = document.querySelector('.save-status');
        const saveAllBtn = document.getElementById('save-all-btn');
        const dropdownSaveAllBtn = document.getElementById('dropdown-save-all-btn');
        const syncIndicator = document.getElementById('sync-indicator');
        const syncBadge = document.getElementById('sync-badge');
        
        if (!status) return;
        
        const icon = status.querySelector('i');
        const text = status.querySelector('span');
        const modifiedCount = this.getModifiedFileCount();
        
        // Determine cloud sync status
        const isCloudEnabled = this.storage?.db?.useCloud && this.storage?.db?.userId;
        const syncStatus = isCloudEnabled ? 'synced' : 'offline';
        
        // Update sync indicator (small cloud icon)
        if (syncIndicator) {
            syncIndicator.classList.remove('synced', 'syncing', 'error', 'offline');
            syncIndicator.classList.add(syncStatus);
            syncIndicator.title = isCloudEnabled ? 'Cloud sync enabled' : 'Local storage only';
        }
        
        // Update sync badge in dropdown
        if (syncBadge) {
            syncBadge.classList.remove('synced', 'syncing', 'error', 'offline');
            syncBadge.classList.add(syncStatus);
            const badgeText = syncBadge.querySelector('span');
            if (badgeText) {
                badgeText.textContent = isCloudEnabled ? 'Cloud Sync' : 'Local Only';
            }
        }
        
        // Update main status indicator
        if (modifiedCount > 0 || this.state.isDirty) {
            status.classList.remove('saved', 'saving');
            status.classList.add('unsaved', 'clickable');
            icon.className = 'fas fa-exclamation-circle';
            text.textContent = `${modifiedCount} Unsaved`;
            status.title = 'Click to view unsaved files';
            status.style.cursor = 'pointer';
        } else {
            status.classList.remove('unsaved', 'saving', 'clickable');
            status.classList.add('saved');
            icon.className = 'fas fa-check-circle';
            text.textContent = 'All Saved';
            status.title = 'All changes saved';
            status.style.cursor = 'pointer';
        }
        
        // Update Save All button state (both header and dropdown)
        const hasUnsaved = modifiedCount > 0;
        if (saveAllBtn) {
            saveAllBtn.disabled = !hasUnsaved;
            if (hasUnsaved) {
                saveAllBtn.title = `Save all ${modifiedCount} modified file${modifiedCount > 1 ? 's' : ''} (Ctrl+Shift+S)`;
                saveAllBtn.classList.add('has-changes');
            } else {
                saveAllBtn.title = 'All files saved (Ctrl+Shift+S)';
                saveAllBtn.classList.remove('has-changes');
            }
        }
        
        if (dropdownSaveAllBtn) {
            dropdownSaveAllBtn.disabled = !hasUnsaved;
            dropdownSaveAllBtn.innerHTML = hasUnsaved 
                ? `<i class="fas fa-save"></i> Save All (${modifiedCount})`
                : `<i class="fas fa-check"></i> All Saved`;
        }
        
        // Update the unsaved files dropdown content
        this.updateUnsavedFilesDropdown();
    }
    
    /**
     * Toggle unsaved files dropdown
     */
    toggleUnsavedFilesDropdown() {
        const dropdown = document.getElementById('recent-changes-dropdown');
        if (!dropdown) return;
        
        if (dropdown.classList.contains('hidden')) {
            this.showUnsavedFilesDropdown();
        } else {
            dropdown.classList.add('hidden');
        }
    }
    
    /**
     * Show unsaved files dropdown
     */
    showUnsavedFilesDropdown() {
        const dropdown = document.getElementById('recent-changes-dropdown');
        if (!dropdown) return;
        
        this.updateUnsavedFilesDropdown();
        dropdown.classList.remove('hidden');
        
        // Close on click outside
        const closeHandler = (e) => {
            const container = document.querySelector('.save-status-container');
            if (!dropdown.contains(e.target) && (!container || !container.contains(e.target))) {
                dropdown.classList.add('hidden');
                document.removeEventListener('click', closeHandler);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeHandler);
        }, 0);
    }
    
    /**
     * Update unsaved files dropdown content
     */
    updateUnsavedFilesDropdown() {
        const dropdown = document.getElementById('recent-changes-dropdown');
        const contentEl = document.getElementById('recent-changes-list');
        const headerEl = dropdown?.querySelector('.dropdown-header h4');
        const footerEl = dropdown?.querySelector('.dropdown-footer');
        
        if (!dropdown || !contentEl) return;
        
        const modifiedFiles = this.getModifiedFilesList();
        const lastSavedTime = this.getLastSavedRelativeTime();
        
        // Update header with last saved info
        if (headerEl) {
            if (modifiedFiles.length > 0) {
                headerEl.textContent = `Unsaved Files (${modifiedFiles.length})`;
            } else if (lastSavedTime) {
                headerEl.innerHTML = `<span>All Saved</span><span class="last-saved-time">Last saved: ${lastSavedTime}</span>`;
            } else {
                headerEl.textContent = 'Save Status';
            }
        }
        
        if (modifiedFiles.length === 0) {
            contentEl.innerHTML = `
                <div class="no-changes">
                    <i class="fas fa-check-circle"></i>
                    <span>All changes saved</span>
                    ${lastSavedTime ? `<span class="last-saved-subtitle">Last saved: ${lastSavedTime}</span>` : ''}
                </div>
            `;
            // Hide footer when no changes
            if (footerEl) footerEl.style.display = 'none';
            return;
        }
        
        // Show footer when there are changes
        if (footerEl) footerEl.style.display = '';
        
        // Build list of modified files with timestamps
        contentEl.innerHTML = `
            <div id="save-progress-indicator" class="save-progress-indicator" style="display: none;"></div>
            ${modifiedFiles.map(item => `
                <div class="change-entry" data-type="${item.type}" data-name="${this.escapeHtml(item.name)}">
                    <div class="change-entry-icon">
                        <i class="${item.icon}"></i>
                    </div>
                    <div class="change-entry-info">
                        <div class="change-entry-title">
                            <span class="file-name">${this.escapeHtml(item.name)}</span>
                            ${item.isNew ? '<span class="change-badge new">NEW</span>' : '<span class="change-badge modified">MODIFIED</span>'}
                        </div>
                        <div class="change-entry-meta">
                            <span class="file-type">${this.capitalizeFirst(item.type)}</span>
                            ${item.lastModified ? `<span class="file-timestamp">${this.formatTimestamp(item.lastModified)}</span>` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        `;
        
        // Add click handlers
        contentEl.querySelectorAll('.change-entry').forEach(el => {
            el.addEventListener('click', () => {
                const type = el.dataset.type;
                const name = el.dataset.name;
                this.navigateToModifiedFile(type, name);
                dropdown.classList.add('hidden');
            });
        });
    }
    
    /**
     * Capitalize first letter
     */
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    /**
     * Navigate to a modified file
     */
    navigateToModifiedFile(type, name) {
        if (type === 'spawner') {
            this.showSpawnerEditor(name);
            return;
        }

        if (type === 'stat') {
            // Open stats file view (file view listing entries)
            this.showStatsEditor(false);
            // If stats editor is initialized, switch to file view
            if (this.statsEditor && typeof this.statsEditor.show === 'function') {
                // Show file view
                this.statsEditor.show(null, true);
            }
            return;
        }
        
        // Find the file in the pack
        if (this.state.currentPack) {
            const typeMap = {
                'mob': 'mobs',
                'skill': 'skills',
                'item': 'items',
                'droptable': 'droptables',
                'randomspawn': 'randomspawns'
            };
            
            const collection = this.state.currentPack[typeMap[type]] || [];
            const file = collection.find(f => (f.internalName || f.name) === name);
            
            if (file) {
                this.openFile(file, type);
            }
        }
    }
    
    /**
     * Escape HTML entities
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Show saving status
     */
    showSavingStatus() {
        const status = document.querySelector('.save-status');
        if (!status) return;
        
        const icon = status.querySelector('i');
        const text = status.querySelector('span');
        
        status.classList.remove('saved', 'unsaved');
        status.classList.add('saving');
        icon.className = 'fas fa-sync fa-spin';
        text.textContent = 'Saving...';
    }
    
    /**
     * Save all modified files
     * This collects all files with unsaved changes, clears their modified flags,
     * and saves the entire pack to storage in one operation.
     */
    async saveAll(silent = false) {
        if (!this.state.currentPack) {
            if (!silent) this.showToast('No pack is currently open', 'warning');
            return;
        }
        
        // Collect all files that actually have unsaved changes
        const modifiedFiles = [];
        const fileTypes = ['mobs', 'skills', 'items', 'droptables', 'randomspawns', 'spawners', 'stats'];
        
        fileTypes.forEach(type => {
            // Stats is a single file container
            if (type === 'stats') {
                const statsFile = this.state.currentPack.stats;
                if (statsFile && this.fileHasUnsavedChanges(statsFile)) {
                    modifiedFiles.push({ file: statsFile, type: 'stat' });
                }
                return;
            }

            // Spawners are stored as per-pack spawnerFiles (object) and/or as an array depending on workflows
            if (type === 'spawners') {
                // Per-pack spawnerFiles object
                const spawnerFilesObj = this.state.currentPack.spawnerFiles || {};
                for (const [fileName, fileObj] of Object.entries(spawnerFilesObj)) {
                    if (this.fileHasUnsavedChanges(fileObj)) {
                        // Attach a displayName for UI if missing
                        fileObj.fileName = fileObj.fileName || fileName;
                        modifiedFiles.push({ file: fileObj, type: 'spawner' });
                    }
                }

                // Legacy spawners array (sometimes used)
                const spawnerArray = this.state.currentPack.spawners || [];
                if (Array.isArray(spawnerArray)) {
                    spawnerArray.forEach(s => {
                        if (this.fileHasUnsavedChanges(s)) {
                            modifiedFiles.push({ file: s, type: 'spawner' });
                        }
                    });
                }

                // Also include global spawners
                if (window.globalSpawnerFiles) {
                    for (const [fileName, fileObj] of Object.entries(window.globalSpawnerFiles)) {
                        if (this.fileHasUnsavedChanges(fileObj)) {
                            fileObj.fileName = fileObj.fileName || fileName;
                            modifiedFiles.push({ file: fileObj, type: 'spawner' });
                        }
                    }
                }

                return;
            }

            // Regular file collections (arrays)
            const files = this.state.currentPack[type] || [];
            if (!Array.isArray(files)) {
                console.warn(`Skipping saveAll for non-array pack collection: ${type}`, files);
                return; // continue to next type
            }
            files.forEach(file => {
                if (this.fileHasUnsavedChanges(file)) {
                    modifiedFiles.push({ file, type: type.slice(0, -1) }); // Remove 's' from type
                }
            });
        });
        
        // Also check if current spawner has unsaved changes
        if (this.state.currentSpawnerFile && this.spawnerEditor) {
            // Auto-save current spawner
            await this.spawnerEditor.saveSpawner();
        }
        
        if (modifiedFiles.length === 0) {
            if (!silent) this.showToast('No files to save', 'info');
            return;
        }
        
        const saveAllBtn = document.getElementById('save-all-btn');
        
        // Initialize save progress
        this.state.saveProgress = { current: 0, total: modifiedFiles.length, currentFile: '' };
        
        // Disable button during save and show progress (skip for silent auto-save)
        if (saveAllBtn && !silent) {
            saveAllBtn.disabled = true;
            saveAllBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Saving 0/${modifiedFiles.length}...`;
        }
        
        if (!silent) {
            this.showSavingStatus();
            this.updateSaveProgressUI();
        }
        
        if (window.DEBUG_MODE) console.log(`💾 Saving ${modifiedFiles.length} modified file${modifiedFiles.length > 1 ? 's' : ''}...`);
        
        try {
            // Deduplicate references (same file object might appear multiple times)
            const uniqueModifiedFiles = [];
            const seen = new WeakSet();
            for (const mf of modifiedFiles) {
                if (!seen.has(mf.file)) {
                    uniqueModifiedFiles.push(mf);
                    seen.add(mf.file);
                }
            }
            
            // Update total with deduplicated count
            this.state.saveProgress.total = uniqueModifiedFiles.length;

            // Clear modified flags on all files BEFORE saving
            // This ensures the pack data saved to storage has clean flags
            for (let i = 0; i < uniqueModifiedFiles.length; i++) {
                const { file, type } = uniqueModifiedFiles[i];
                const displayName = file.fileName || file.name || file.internalName || 'Unnamed';
                
                // Update progress UI (skip for silent auto-save)
                this.state.saveProgress.current = i + 1;
                this.state.saveProgress.currentFile = displayName;
                if (!silent) this.updateSaveProgressUI();
                
                // Clear file-level flags
                file.modified = false;
                file.isNew = false;
                file.lastSaved = new Date().toISOString();

                // Also clear entry-level flags when applicable
                if (Array.isArray(file.entries)) {
                    file.entries.forEach(e => {
                        if (e) {
                            e.modified = false;
                            e.isNew = false;
                            e.lastSaved = new Date().toISOString();
                        }
                    });
                }
                
                if (window.DEBUG_MODE) console.log(`✅ Cleared flags for: ${displayName}`);
            }

            // Save the entire pack to storage ONCE (not per file)
            // This is more efficient and ensures atomic save
            let saveSuccess = false;
            let retryCount = 0;
            const maxRetries = 3;

            while (!saveSuccess && retryCount < maxRetries) {
                try {
                    await this.packManager.savePacks(true); // true = immediate save, bypass debounce
                    saveSuccess = true;
                    if (window.DEBUG_MODE) console.log(`✅ Pack saved successfully to storage`);
                } catch (error) {
                    retryCount++;
                    if (retryCount >= maxRetries) {
                        console.error('Failed to save pack after retries:', error);
                        // Restore modified flags since save failed
                        for (const { file } of uniqueModifiedFiles) {
                            file.modified = true;
                        }
                        throw error;
                    } else {
                        if (window.DEBUG_MODE) console.warn(`⚠️ Save attempt ${retryCount} failed, retrying...`);
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
            }

            // Update last saved timestamp
            this.state.lastSavedTimestamp = new Date();
            
            // Clear the dirty state - all files are now saved
            this.state.isDirty = false;
            this.state.hasContentEdits = false;
            this.updateSaveStatusIndicator();

            // Refresh tree to reflect saved state (with enhanced badges)
            if (this.packManager && typeof this.packManager.renderPackTree === 'function') {
                this.packManager.renderPackTree();
            } else if (this.packManager && typeof this.packManager.refresh === 'function') {
                this.packManager.refresh();
            }

            // Show success message (skip for silent auto-save)
            if (!silent) {
                this.showToast(`✅ Successfully saved ${uniqueModifiedFiles.length} file${uniqueModifiedFiles.length > 1 ? 's' : ''}`, 'success');
            }
            
        } catch (error) {
            console.error('Save all failed:', error);
            if (!silent) {
                this.showToast('❌ Failed to save files. Please try again.', 'error');
            }
            
            // Re-check dirty state since some saves may have failed
            this.state.isDirty = this.hasModifiedFiles();
            this.state.hasContentEdits = this.state.isDirty;
            this.updateSaveStatusIndicator();
        } finally {
            // Re-enable button
            if (saveAllBtn && !silent) {
                saveAllBtn.innerHTML = '<i class="fas fa-save"></i> Save All';
                this.updateSaveStatusIndicator(); // This will set correct disabled state
            }
        }
    }
    
    /**
     * Add entry to change history
     */
    addToChangeHistory(change) {
        if (!this.settings.keepHistory) return;
        
        const entry = {
            ...change,
            timestamp: Date.now(),
            description: `${change.changeType === 'created' ? 'Created' : 'Modified'} ${change.fileType}`
        };
        
        // Check if this file already has a recent entry (within last 5 seconds)
        const recentIndex = this.changeHistory.findIndex(
            h => h.fileName === change.fileName && 
                 h.fileType === change.fileType && 
                 (Date.now() - h.timestamp) < 5000
        );
        
        if (recentIndex !== -1) {
            // Update existing entry
            this.changeHistory[recentIndex] = entry;
        } else {
            // Add new entry at the beginning
            this.changeHistory.unshift(entry);
        }
        
        // Keep only max history entries from settings
        const maxHistory = this.settings.maxHistory || 100;
        if (this.changeHistory.length > maxHistory) {
            this.changeHistory = this.changeHistory.slice(0, maxHistory);
        }
        
        this.updateRecentChangesDropdown();
    }
    
    /**
     * Update save progress UI during Save All operation
     */
    updateSaveProgressUI() {
        const saveAllBtn = document.getElementById('save-all-btn');
        const dropdownSaveAllBtn = document.getElementById('dropdown-save-all-btn');
        const { current, total, currentFile } = this.state.saveProgress;
        
        if (total === 0) return;
        
        const progressText = `Saving ${current}/${total}...`;
        
        if (saveAllBtn && saveAllBtn.disabled) {
            saveAllBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${progressText}`;
            saveAllBtn.title = currentFile ? `Saving: ${currentFile}` : progressText;
        }
        
        if (dropdownSaveAllBtn && dropdownSaveAllBtn.disabled) {
            dropdownSaveAllBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${progressText}`;
        }
        
        // Update the dropdown content with progress
        const progressEl = document.getElementById('save-progress-indicator');
        if (progressEl) {
            progressEl.innerHTML = `
                <div class="save-progress-bar">
                    <div class="save-progress-fill" style="width: ${(current/total) * 100}%"></div>
                </div>
                <div class="save-progress-text">${currentFile || progressText}</div>
            `;
        }
    }
    
    /**
     * Get relative time string for last saved timestamp
     */
    getLastSavedRelativeTime() {
        if (!this.state.lastSavedTimestamp) return null;
        
        const now = new Date();
        const diff = now - this.state.lastSavedTimestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (seconds < 5) return 'just now';
        if (seconds < 60) return `${seconds} seconds ago`;
        if (minutes === 1) return '1 minute ago';
        if (minutes < 60) return `${minutes} minutes ago`;
        if (hours === 1) return '1 hour ago';
        if (hours < 24) return `${hours} hours ago`;
        if (days === 1) return 'yesterday';
        return `${days} days ago`;
    }
    
    /**
     * Format timestamp for display
     */
    formatTimestamp(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    /**
     * Check for cloud conflicts before saving
     * Returns true if save should proceed, false if user cancelled
     */
    async checkForCloudConflicts() {
        if (!this.storage?.db?.useCloud || !this.state.cloudDataHash) {
            return { proceed: true };
        }
        
        try {
            const conflictResult = await this.storage.db.checkForConflicts(
                'packs',
                this.packManager?.packs,
                this.state.cloudDataHash
            );
            
            if (conflictResult.hasConflict) {
                if (window.DEBUG_MODE) console.warn('⚠️ Cloud conflict detected!', conflictResult);
                
                // Show conflict resolution modal
                const resolution = await this.showConflictModal(conflictResult);
                return resolution;
            }
        } catch (error) {
            if (window.DEBUG_MODE) console.warn('Conflict check error:', error);
        }
        
        return { proceed: true };
    }
    
    /**
     * Show conflict resolution modal
     */
    showConflictModal(conflictInfo) {
        return new Promise((resolve) => {
            // Create modal HTML
            const modalHtml = `
                <div class="modal-overlay conflict-modal-overlay" id="conflict-modal-overlay">
                    <div class="modal conflict-modal">
                        <div class="modal-header conflict-header">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Cloud Sync Conflict</h3>
                        </div>
                        <div class="modal-body">
                            <p class="conflict-message">
                                The cloud data has been modified since you started editing.
                                Choose how to resolve this conflict:
                            </p>
                            <div class="conflict-info">
                                <div class="conflict-detail">
                                    <i class="fas fa-cloud"></i>
                                    <span>Cloud updated: ${new Date(conflictInfo.cloudUpdatedAt).toLocaleString()}</span>
                                </div>
                            </div>
                            <div class="conflict-options">
                                <button class="btn conflict-btn keep-local" data-action="local">
                                    <i class="fas fa-laptop"></i>
                                    <div class="conflict-btn-content">
                                        <strong>Keep Local Changes</strong>
                                        <span>Overwrite cloud with your changes</span>
                                    </div>
                                </button>
                                <button class="btn conflict-btn use-cloud" data-action="cloud">
                                    <i class="fas fa-cloud-download-alt"></i>
                                    <div class="conflict-btn-content">
                                        <strong>Use Cloud Version</strong>
                                        <span>Discard local changes, use cloud data</span>
                                    </div>
                                </button>
                                <button class="btn conflict-btn view-diff" data-action="diff">
                                    <i class="fas fa-code-branch"></i>
                                    <div class="conflict-btn-content">
                                        <strong>View Differences</strong>
                                        <span>Compare local vs cloud before deciding</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" data-action="cancel">Cancel</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modal = document.getElementById('conflict-modal-overlay');
            
            // Handle button clicks
            modal.addEventListener('click', async (e) => {
                const action = e.target.closest('[data-action]')?.dataset.action;
                if (!action) return;
                
                modal.remove();
                
                switch (action) {
                    case 'local':
                        // Keep local, overwrite cloud
                        resolve({ proceed: true, useCloudData: false });
                        break;
                    case 'cloud':
                        // Use cloud data, discard local
                        await this.loadCloudData(conflictInfo.cloudData);
                        resolve({ proceed: false, useCloudData: true });
                        break;
                    case 'diff':
                        // Show diff view
                        await this.showConflictDiff(conflictInfo);
                        // After viewing diff, show modal again
                        const newResolution = await this.showConflictModal(conflictInfo);
                        resolve(newResolution);
                        break;
                    case 'cancel':
                    default:
                        resolve({ proceed: false, cancelled: true });
                        break;
                }
            });
        });
    }
    
    /**
     * Load cloud data (when user chooses cloud version in conflict)
     */
    async loadCloudData(cloudData) {
        try {
            if (cloudData && this.packManager) {
                this.packManager.packs = cloudData;
                this.packManager.renderPackTree();
                this.showToast('✅ Loaded cloud version', 'success');
                
                // Update hash
                this.state.cloudDataHash = this.storage.db.generateDataHash(cloudData);
            }
        } catch (error) {
            console.error('Failed to load cloud data:', error);
            this.showToast('❌ Failed to load cloud version', 'error');
        }
    }
    
    /**
     * Show conflict diff view
     */
    async showConflictDiff(conflictInfo) {
        return new Promise((resolve) => {
            const localSummary = this.getPackSummary(this.packManager?.packs);
            const cloudSummary = this.getPackSummary(conflictInfo.cloudData);
            
            const diffHtml = `
                <div class="modal-overlay diff-modal-overlay" id="diff-modal-overlay">
                    <div class="modal diff-modal">
                        <div class="modal-header">
                            <h3><i class="fas fa-code-branch"></i> Compare Versions</h3>
                        </div>
                        <div class="modal-body">
                            <div class="diff-comparison">
                                <div class="diff-column local-column">
                                    <h4><i class="fas fa-laptop"></i> Local Version</h4>
                                    <div class="diff-summary">
                                        ${localSummary}
                                    </div>
                                </div>
                                <div class="diff-divider">
                                    <i class="fas fa-arrows-alt-h"></i>
                                </div>
                                <div class="diff-column cloud-column">
                                    <h4><i class="fas fa-cloud"></i> Cloud Version</h4>
                                    <div class="diff-summary">
                                        ${cloudSummary}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" id="close-diff-btn">Close</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', diffHtml);
            const modal = document.getElementById('diff-modal-overlay');
            
            document.getElementById('close-diff-btn').addEventListener('click', () => {
                modal.remove();
                resolve();
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    resolve();
                }
            });
        });
    }
    
    /**
     * Show auto-save suggestion modal after repeated unsaved changes popups
     * @returns {Promise<boolean>} True if user wants to enable auto-save
     */
    showAutoSaveSuggestionModal() {
        return new Promise((resolve) => {
            const modalHtml = `
                <div class="modal-overlay autosave-suggestion-modal" id="autosave-suggestion-overlay">
                    <div class="modal autosave-suggestion-content">
                        <div class="autosave-suggestion-header">
                            <i class="fas fa-save autosave-icon pulse-animation"></i>
                            <h2>Enable Auto-Save?</h2>
                        </div>
                        <div class="autosave-suggestion-body">
                            <p class="autosave-message">
                                <i class="fas fa-lightbulb"></i>
                                We noticed you've had unsaved changes multiple times. Would you like to enable <strong>Auto-Save</strong> to automatically save your work?
                            </p>
                            <div class="autosave-benefits">
                                <h4><i class="fas fa-star"></i> Benefits of Auto-Save:</h4>
                                <ul>
                                    <li><i class="fas fa-check-circle"></i> Never lose your work unexpectedly</li>
                                    <li><i class="fas fa-check-circle"></i> Changes are saved automatically as you work</li>
                                    <li><i class="fas fa-check-circle"></i> No more "Unsaved changes" popups</li>
                                    <li><i class="fas fa-check-circle"></i> Syncs to cloud automatically (if connected)</li>
                                </ul>
                            </div>
                            <div class="autosave-settings-preview">
                                <p><i class="fas fa-cog"></i> You can adjust auto-save settings anytime in <strong>Settings</strong>.</p>
                            </div>
                        </div>
                        <div class="autosave-suggestion-footer">
                            <button class="btn btn-success btn-lg" id="enable-autosave-btn">
                                <i class="fas fa-check"></i> Enable Auto-Save
                            </button>
                            <button class="btn btn-secondary" id="decline-autosave-btn">
                                <i class="fas fa-times"></i> No Thanks
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modal = document.getElementById('autosave-suggestion-overlay');
            
            // Animate in
            requestAnimationFrame(() => {
                modal.classList.add('visible');
            });
            
            const cleanup = (result) => {
                modal.classList.remove('visible');
                setTimeout(() => modal.remove(), 300);
                resolve(result);
            };
            
            document.getElementById('enable-autosave-btn').addEventListener('click', () => {
                cleanup(true);
            });
            
            document.getElementById('decline-autosave-btn').addEventListener('click', () => {
                cleanup(false);
            });
            
            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cleanup(false);
                }
            });
            
            // Close on Escape
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', escHandler);
                    cleanup(false);
                }
            };
            document.addEventListener('keydown', escHandler);
        });
    }
    
    /**
     * Generate pack summary for diff view
     */
    getPackSummary(packs) {
        if (!packs || !Array.isArray(packs)) {
            return '<p class="diff-empty">No data</p>';
        }
        
        let html = '';
        for (const pack of packs) {
            const mobCount = pack.mobs?.length || 0;
            const skillCount = pack.skills?.length || 0;
            const itemCount = pack.items?.length || 0;
            const droptableCount = pack.droptables?.length || 0;
            
            html += `
                <div class="diff-pack">
                    <strong>${pack.name || 'Unnamed Pack'}</strong>
                    <ul>
                        <li><i class="fas fa-skull"></i> ${mobCount} mobs</li>
                        <li><i class="fas fa-magic"></i> ${skillCount} skills</li>
                        <li><i class="fas fa-gem"></i> ${itemCount} items</li>
                        <li><i class="fas fa-box-open"></i> ${droptableCount} droptables</li>
                    </ul>
                </div>
            `;
        }
        
        return html || '<p class="diff-empty">No packs</p>';
    }
    
    /**
     * Toggle recent changes dropdown - now shows unsaved files when there are unsaved changes
     */
    toggleRecentChanges(e) {
        e.stopPropagation();
        
        const modifiedCount = this.getModifiedFileCount();
        
        // If there are unsaved changes, show unsaved files dropdown
        if (modifiedCount > 0 || this.state.isDirty) {
            this.toggleUnsavedFilesDropdown();
        } else if (this.state.currentMode === 'advanced') {
            // Otherwise show recent changes in advanced mode
            const dropdown = document.getElementById('recent-changes-dropdown');
            if (dropdown) {
                if (dropdown.classList.contains('hidden')) {
                    this.updateRecentChangesDropdown();
                }
                dropdown.classList.toggle('hidden');
            }
        }
    }
    
    /**
     * Update recent changes dropdown content
     */
    updateRecentChangesDropdown() {
        const list = document.getElementById('recent-changes-list');
        if (!list) return;
        
        const recentChanges = this.changeHistory.slice(0, 5);
        
        if (recentChanges.length === 0) {
            list.innerHTML = '<div class="no-changes">No recent changes</div>';
            return;
        }
        
        list.innerHTML = recentChanges.map(change => {
            const timeAgo = this.formatTimeAgo(change.timestamp);
            const icon = this.getFileTypeIcon(change.fileType);
            
            return `
                <div class="change-entry" onclick="window.editor.openChangeFile('${change.fileName}', '${change.fileType}')">
                    <div class="change-entry-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="change-entry-info">
                        <div class="change-entry-title">
                            <span class="file-name">${change.fileName}</span>
                            <span class="change-badge ${change.changeType}">${change.changeType}</span>
                        </div>
                        <div class="change-entry-meta">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Show full change history modal
     */
    showChangeHistory() {
        const modal = document.getElementById('change-history-modal');
        if (!modal) return;
        
        modal.classList.remove('hidden');
        this.updateFullHistoryList();
        
        // Hide recent changes dropdown
        document.getElementById('recent-changes-dropdown')?.classList.add('hidden');
    }
    
    /**
     * Close change history modal
     */
    closeChangeHistory() {
        const modal = document.getElementById('change-history-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    /**
     * Update full history list
     */
    updateFullHistoryList() {
        const list = document.getElementById('full-history-list');
        if (!list) return;
        
        if (this.changeHistory.length === 0) {
            list.innerHTML = '<div class="no-changes">No changes recorded</div>';
            return;
        }
        
        list.innerHTML = this.changeHistory.map(change => {
            const timeAgo = this.formatTimeAgo(change.timestamp);
            const icon = this.getFileTypeIcon(change.fileType);
            const date = new Date(change.timestamp).toLocaleString();
            
            return `
                <div class="change-entry" onclick="window.editor.openChangeFile('${change.fileName}', '${change.fileType}')">
                    <div class="change-entry-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="change-entry-info">
                        <div class="change-entry-title">
                            <span class="file-name">${change.fileName}</span>
                            <span class="change-badge ${change.changeType}">${change.changeType}</span>
                        </div>
                        <div class="change-entry-meta">${timeAgo} - ${date}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Clear change history
     */
    async clearChangeHistory() {
        const confirmed = await window.notificationModal?.confirm(
            'Are you sure you want to clear the change history? This action cannot be undone.',
            'Clear History',
            { confirmText: 'Clear', confirmButtonClass: 'danger' }
        );
        
        if (confirmed) {
            this.changeHistory = [];
            this.updateRecentChangesDropdown();
            this.updateFullHistoryList();
            this.showToast('Change history cleared', 'success');
        }
    }
    
    /**
     * Filter change history based on search query
     */
    filterChangeHistory(query) {
        const list = document.getElementById('full-history-list');
        if (!list) return;
        
        const filtered = this.changeHistory.filter(change => 
            change.fileName.toLowerCase().includes(query.toLowerCase()) ||
            change.fileType.toLowerCase().includes(query.toLowerCase()) ||
            change.changeType.toLowerCase().includes(query.toLowerCase())
        );
        
        if (filtered.length === 0) {
            list.innerHTML = '<div class="no-changes">No matching changes found</div>';
            return;
        }
        
        list.innerHTML = filtered.map(change => {
            const timeAgo = this.formatTimeAgo(change.timestamp);
            const icon = this.getFileTypeIcon(change.fileType);
            const date = new Date(change.timestamp).toLocaleString();
            
            return `
                <div class="change-entry" onclick="window.editor.openChangeFile('${change.fileName}', '${change.fileType}')">
                    <div class="change-entry-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="change-entry-info">
                        <div class="change-entry-title">
                            <span class="file-name">${change.fileName}</span>
                            <span class="change-badge ${change.changeType}">${change.changeType}</span>
                        </div>
                        <div class="change-entry-meta">${timeAgo} - ${date}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Open a file from change history
     */
    openChangeFile(fileName, fileType) {
        if (!this.state.currentPack) return;
        
        const files = this.state.currentPack[fileType + 's'];
        const file = files?.find(f => f.name === fileName);
        
        if (file) {
            this.openFile(file, fileType);
            this.closeChangeHistory();
            document.getElementById('recent-changes-dropdown')?.classList.add('hidden');
        } else {
            this.showToast('File not found', 'error');
        }
    }
    
    /**
     * Get icon for file type
     */
    getFileTypeIcon(type) {
        const icons = {
            mob: 'fa-skull',
            skill: 'fa-magic',
            item: 'fa-gem',
            droptable: 'fa-table',
            randomspawn: 'fa-map-marked-alt'
        };
        return icons[type] || 'fa-file';
    }
    
    /**
     * Format timestamp to relative time
     */
    formatTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    }
    
    /**
     * Update breadcrumb navigation
     */
    updateBreadcrumb() {
        const breadcrumb = document.getElementById('breadcrumb');
        const homeBtn = document.getElementById('breadcrumb-home');
        if (!breadcrumb) return;
        
        let html = '';
        
        if (this.state.currentView === 'dashboard') {
            html = '<span class="breadcrumb-item">Dashboard</span>';
            if (homeBtn) homeBtn.style.display = 'none';
        } else if (this.state.currentPack && this.state.currentFile) {
            if (homeBtn) homeBtn.style.display = 'flex';
            const fileName = this.state.currentFile.internalName || this.state.currentFile.name || 'Unnamed';
            const parentFile = this.state.currentFile._parentFile;
            
            if (parentFile) {
                // File-based structure: show parent file in breadcrumb
                html = `
                    <span class="breadcrumb-item">${this.state.currentPack.name}</span>
                    <span class="breadcrumb-item">${this.state.currentFileType}s</span>
                    <span class="breadcrumb-item">${parentFile.fileName}</span>
                    <span class="breadcrumb-item">${fileName}</span>
                `;
            } else {
                // Legacy flat structure or config files
                html = `
                    <span class="breadcrumb-item">${this.state.currentPack.name}</span>
                    <span class="breadcrumb-item">${this.state.currentFileType}s</span>
                    <span class="breadcrumb-item">${fileName}</span>
                `;
            }
        } else {
            if (homeBtn) homeBtn.style.display = 'none';
        }
        
        // Preserve home button when updating breadcrumb
        if (homeBtn) {
            breadcrumb.innerHTML = '';
            breadcrumb.appendChild(homeBtn);
            breadcrumb.insertAdjacentHTML('beforeend', html);
        } else {
            breadcrumb.innerHTML = html;
        }
    }
    
    /**
     * Update YAML preview
     */
    async updateYAMLPreview() {
        // Cache preview element
        if (!this._previewElement) {
            this._previewElement = document.getElementById('yaml-preview-content');
            
            // Initialize flags - start with _updatingPreview true to prevent initial content from being seen as user edit
            this._previewHasManualEdits = false;
            this._originalPreviewContent = '';
            this._updatingPreview = true;
            
            // Use MutationObserver to detect ANY changes to the preview content
            this._previewObserver = new MutationObserver((mutations) => {
                // Only track if the mutation was from user input, not from programmatic updates
                if (!this._updatingPreview) {
                    this._previewHasManualEdits = true;
                }
            });
            
            // Start observing the preview element and its children
            this._previewObserver.observe(this._previewElement, {
                characterData: true,
                characterDataOldValue: true,
                childList: true,
                subtree: true
            });
            
            // Track manual edits in the preview panel (backup to MutationObserver)
            this._previewElement.addEventListener('input', () => {
                this._previewHasManualEdits = true;
            });
            
            // Track blur event (when user clicks out of the preview panel)
            this._previewElement.addEventListener('blur', () => {
                const currentContent = this._previewElement.textContent;
                
                // Check if content has changed
                if (currentContent !== this._originalPreviewContent) {
                    this._previewHasManualEdits = true;
                    // Immediately prompt the user to save changes
                    this.promptToSavePreviewEdits();
                }
            });
            
            // Track focus event
            this._previewElement.addEventListener('focus', () => {
                // Store the content when user starts editing
                if (!this._previewHasManualEdits) {
                    this._editStartContent = this._previewElement.textContent;
                }
            });
            
            // Keyboard shortcuts for preview panel
            this._previewElement.addEventListener('keydown', async (e) => {
                // Ctrl+S: Apply changes and save
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    if (this._previewHasManualEdits) {
                        const currentContent = this._previewElement.textContent;
                        await this.applyManualYAMLEdits(currentContent, true);
                        this._previewHasManualEdits = false;
                    }
                }
                // Esc: Discard changes
                else if (e.key === 'Escape') {
                    e.preventDefault();
                    if (this._previewHasManualEdits) {
                        this._previewHasManualEdits = false;
                        this.updateYAMLPreview();
                    }
                }
                // Ctrl+Enter: Apply changes without saving
                else if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    if (this._previewHasManualEdits) {
                        const currentContent = this._previewElement.textContent;
                        await this.applyManualYAMLEdits(currentContent, false);
                        this._previewHasManualEdits = false;
                    }
                }
            });
        }
        const preview = this._previewElement;
        
        if (!preview) {
            if (window.DEBUG_MODE) console.warn('YAML preview element not found');
            return;
        }
        
        // Reset manual edits flag when updating preview programmatically
        this._previewHasManualEdits = false;
        
        if (!this.state.currentFile && !this.state.currentSpawnerFile) {
            preview.textContent = '# Select an item to see YAML preview';
            return;
        }
        
        // If we're viewing a spawner, let the spawner editor handle the preview
        if (this.state.currentSpawnerFile && this.spawnerEditor) {
            return; // Spawner editor manages its own preview updates
        }
        
        try {
            let yaml;
            
            // Handle packinfo specially
            if (this.state.currentFileType === 'packinfo') {
                const packinfo = this.state.currentFile.data || this.state.currentFile;
                yaml = `Name: ${packinfo.Name}\nVersion: ${packinfo.Version}\nAuthor: ${packinfo.Author}\nIcon:\n  Material: ${packinfo.Icon.Material}\n  Model: ${packinfo.Icon.Model}\nURL: ${packinfo.URL}\nDescription:\n${packinfo.Description.map(line => `- ${line}`).join('\n')}`;
            } else if (this.state.currentFileType === 'stats') {
                // Handle stats.yml file - export all stats entries
                const statsFile = this.state.currentFile;
                if (statsFile && statsFile.entries && statsFile.entries.length > 0) {
                    yaml = statsFile.entries.map(stat => this.yamlExporter.exportStat(stat)).join('\n');
                } else {
                    yaml = '# No stats configured yet\n# Click "New Stat" to add your first stat';
                }
            } else if (this.state.currentFileType === 'stat') {
                // Handle single stat editing - export just this stat
                const stat = this.state.currentFile;
                if (stat && (stat.name || stat.Display)) {
                    yaml = this.yamlExporter.exportStat(stat);
                } else {
                    yaml = '# New stat - enter details above';
                }
            } else {
                // Set pack context for template-aware mob exports
                if (this.state.currentPack && this.state.currentFileType === 'mob') {
                    this.yamlExporter.setPackContext(this.state.currentPack);
                }
                // Use exportWithoutFooter for preview (footer only in exported files)
                yaml = this.yamlExporter.exportWithoutFooter(this.state.currentFile, this.state.currentFileType);
            }
            
            // Only update DOM if content actually changed
            if (preview.textContent !== yaml) {
                // Set flag to prevent MutationObserver from treating this as user edit
                this._updatingPreview = true;
                
                preview.textContent = yaml;
                
                // Store original content for change detection
                this._originalPreviewContent = yaml;
                this._previewHasManualEdits = false;
                
                // Use requestAnimationFrame to ensure DOM updates are complete before clearing flag
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        this._updatingPreview = false;
                    });
                });
            }
            
            // Update YAML editor content if in edit mode
            if (this.yamlEditor && this.yamlEditor.isEditing) {
                this.yamlEditor.setContent(yaml);
            }
        } catch (error) {
            console.error('Failed to generate YAML preview:', error);
            preview.innerHTML = '<code># Error generating preview</code>';
        }
    }
    
    /**
     * Prompt user to save preview edits (called when blurring out of preview panel)
     */
    async promptToSavePreviewEdits() {
        if (!this._previewElement || !this._previewHasManualEdits) {
            return;
        }
        
        const currentContent = this._previewElement.textContent;
        
        if (currentContent === this._originalPreviewContent) {
            this._previewHasManualEdits = false;
            return;
        }
        
        const result = await this.showConfirmDialog(
            'You have manual edits in the YAML preview panel. Would you like to apply them?',
            'Save YAML Preview Edits',
            [
                { text: 'Apply Changes', value: 'apply', primary: true },
                { text: 'Discard Changes', value: 'discard' },
                { text: 'Keep Editing', value: 'cancel' }
            ]
        );
        
        if (result === 'apply') {
            await this.applyManualYAMLEdits(currentContent);
            this._previewHasManualEdits = false;
        } else if (result === 'discard') {
            this.updateYAMLPreview();
            this._previewHasManualEdits = false;
        } else {
            // Re-focus the preview panel so they can continue editing
            this._previewElement.focus();
        }
    }
    
    /**
     * Apply manual YAML edits from preview panel to form data
     * @param {string} yamlContent - The manually edited YAML content
     * @param {boolean} shouldSave - Whether to save the file after applying changes
     */
    async applyManualYAMLEdits(yamlContent, shouldSave = true) {
        try {
            const parsed = jsyaml.load(yamlContent);
            
            if (!parsed || typeof parsed !== 'object') {
                this.showToast('Invalid YAML format', 'error');
                return;
            }
            
            // Simple merge: Just assign all properties from parsed YAML
            if (this.state.currentFile) {
                Object.assign(this.state.currentFile, parsed);
                
                // Mark file as modified
                this.state.currentFile.modified = true;
                
                // Save the file if requested
                if (shouldSave) {
                    await this.save();
                    this.showToast('Manual YAML edits applied and saved', 'success');
                } else {
                    this.showToast('Manual YAML edits applied', 'success');
                }
                
                // Keep the manual YAML in the preview (don't regenerate)
                this._updatingPreview = true;
                this._previewElement.textContent = yamlContent;
                this._originalPreviewContent = yamlContent;
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        this._updatingPreview = false;
                    });
                });
            }
        } catch (error) {
            console.error('Failed to parse manual YAML edits:', error);
            this.showToast(`Failed to apply YAML edits: ${error.message}`, 'error');
        }
    }
    
    /**
     * Copy YAML to clipboard
     */
    async copyYAML() {
        if (!this.state.currentFile) {
            this.showToast('No file open', 'warning');
            return;
        }
        
        try {
            // Set pack context for template-aware mob exports
            if (this.state.currentPack && this.state.currentFileType === 'mob') {
                this.yamlExporter.setPackContext(this.state.currentPack);
            }
            const yaml = this.yamlExporter.export(this.state.currentFile, this.state.currentFileType);
            await navigator.clipboard.writeText(yaml);
            this.showToast('YAML copied to clipboard', 'success');
        } catch (error) {
            console.error('Failed to copy YAML:', error);
            this.showToast('Failed to copy YAML', 'error');
        }
    }
    
    /**
     * Export YAML
     */
    async exportYAML() {
        if (!this.state.currentFile) {
            this.showToast('No file open', 'warning');
            return;
        }
        
        try {
            // Set pack context for template-aware mob exports
            if (this.state.currentPack && this.state.currentFileType === 'mob') {
                this.yamlExporter.setPackContext(this.state.currentPack);
            }
            const yaml = this.yamlExporter.export(this.state.currentFile, this.state.currentFileType);
            const filename = `${this.state.currentFile.name}.yml`;
            
            const blob = new Blob([yaml], { type: 'text/yaml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showToast('YAML exported successfully', 'success');
        } catch (error) {
            console.error('Failed to export YAML:', error);
            this.showToast('Failed to export YAML', 'error');
        }
    }
    

    
    /**
     * Toggle left sidebar
     */
    toggleLeftSidebar() {
        const sidebar = document.getElementById('sidebar-left');
        const collapsed = document.getElementById('sidebar-left-collapsed');
        const btn = document.getElementById('toggle-left-sidebar');
        
        if (sidebar.classList.contains('collapsed')) {
            sidebar.classList.remove('collapsed');
            collapsed.classList.add('hidden');
            this.state.sidebarLeftCollapsed = false;
            if (btn) {
                btn.querySelector('i').className = 'fas fa-chevron-left';
                btn.title = 'Hide File Tree';
            }
        } else {
            sidebar.classList.add('collapsed');
            collapsed.classList.remove('hidden');
            this.state.sidebarLeftCollapsed = true;
            if (btn) {
                btn.querySelector('i').className = 'fas fa-chevron-right';
                btn.title = 'Show File Tree';
            }
        }
    }
    
    /**
     * Toggle right sidebar
     */
    toggleRightSidebar() {
        const sidebar = document.getElementById('sidebar-right');
        const collapsed = document.getElementById('sidebar-right-collapsed');
        const btn = document.getElementById('toggle-right-sidebar');
        
        if (sidebar.classList.contains('collapsed')) {
            sidebar.classList.remove('collapsed');
            collapsed.classList.add('hidden');
            this.state.sidebarRightCollapsed = false;
            if (btn) {
                btn.querySelector('i').className = 'fas fa-chevron-right';
                btn.title = 'Hide YAML Preview';
            }
        } else {
            sidebar.classList.add('collapsed');
            collapsed.classList.remove('hidden');
            this.state.sidebarRightCollapsed = true;
            if (btn) {
                btn.querySelector('i').className = 'fas fa-chevron-left';
                btn.title = 'Show YAML Preview';
            }
        }
    }
    
    /**
     * Show settings modal
     */
    showSettings() {
        const modal = document.getElementById('settings-modal');
        if (!modal) return;
        
        // Load current settings into form
        document.getElementById('setting-autosave').checked = this.settings.autoSave;
        document.getElementById('setting-autosave-interval').value = this.settings.autoSaveInterval / 1000;
        document.getElementById('autosave-interval-value').textContent = (this.settings.autoSaveInterval / 1000) + 's';
        document.getElementById('setting-animations').checked = this.settings.animations;
        document.getElementById('setting-live-preview').checked = this.settings.livePreview;
        document.getElementById('setting-preview-delay').value = this.settings.livePreviewDebounce;
        document.getElementById('preview-delay-value').textContent = this.settings.livePreviewDebounce + 'ms';
        document.getElementById('setting-default-mode').value = this.settings.defaultMode;
        document.getElementById('setting-compact-mode').checked = this.settings.compactMode;
        document.getElementById('setting-keep-history').checked = this.settings.keepHistory;
        document.getElementById('setting-max-history').value = this.settings.maxHistory;
        document.getElementById('max-history-value').textContent = this.settings.maxHistory;
        document.getElementById('setting-warn-duplicate-files').checked = this.settings.warnDuplicateFiles !== false;
        document.getElementById('setting-internal-name-separator').value = this.settings.internalNameSeparator || '_';
        document.getElementById('setting-delay-display-mode').value = this.settings.delayDisplayMode || 'ticks';
        
        modal.classList.remove('hidden');
    }
    
    /**
     * Close settings modal
     */
    closeSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    /**
     * Switch settings tab
     */
    switchSettingsTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.settings-tab').forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Update panels
        document.querySelectorAll('.settings-panel').forEach(panel => {
            if (panel.id === `settings-${tabName}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
    }
    
    /**
     * Save settings from modal
     */
    saveSettingsFromModal() {
        // Read values from form
        const oldAutoSave = this.settings.autoSave;
        this.settings.autoSave = document.getElementById('setting-autosave').checked;
        this.settings.autoSaveInterval = parseInt(document.getElementById('setting-autosave-interval').value) * 1000;
        this.settings.animations = document.getElementById('setting-animations').checked;
        this.settings.livePreview = document.getElementById('setting-live-preview').checked;
        this.settings.livePreviewDebounce = parseInt(document.getElementById('setting-preview-delay').value);
        this.settings.defaultMode = document.getElementById('setting-default-mode').value;
        this.settings.compactMode = document.getElementById('setting-compact-mode').checked;
        this.settings.keepHistory = document.getElementById('setting-keep-history').checked;
        this.settings.maxHistory = parseInt(document.getElementById('setting-max-history').value);
        this.settings.warnDuplicateFiles = document.getElementById('setting-warn-duplicate-files').checked;
        this.settings.internalNameSeparator = document.getElementById('setting-internal-name-separator').value || '_';
        this.settings.delayDisplayMode = document.getElementById('setting-delay-display-mode').value || 'ticks';
        
        // Clear auto-save timer if auto-save was disabled
        if (oldAutoSave && !this.settings.autoSave) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
        
        // Save to storage
        this.saveSettings();
        
        // Apply settings
        this.applySettings();
        
        // Close modal
        this.closeSettings();
        
        this.showToast('Settings saved successfully', 'success');
    }
    
    /**
     * Reset settings to defaults
     */
    async resetSettings() {
        const confirmed = await this.showConfirmDialog(
            'Reset all settings to default values?',
            'Reset Settings'
        );
        if (!confirmed) return;
        
        this.settings = { ...this.defaultSettings };
        this.saveSettings();
        this.showSettings(); // Reload form
        this.applySettings();
        this.showToast('Settings reset to defaults', 'success');
    }
    
    /**
     * Apply settings to application
     */
    applySettings() {
        // Apply animations setting
        if (this.settings.animations) {
            document.body.classList.remove('no-animations');
        } else {
            document.body.classList.add('no-animations');
        }
        
        // Apply compact mode
        if (this.settings.compactMode) {
            document.body.classList.add('compact-mode');
        } else {
            document.body.classList.remove('compact-mode');
        }
        
        // Apply default mode if no file is open
        if (!this.state.currentFile) {
            this.state.currentMode = this.settings.defaultMode;
            document.body.setAttribute('data-mode', this.state.currentMode);
        }
        
        // Always update mode buttons to reflect current mode
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.state.currentMode);
        });
        
        // Update save-status title based on mode
        const saveStatus = document.getElementById('save-status');
        if (saveStatus) {
            if (this.state.currentMode === 'advanced') {
                saveStatus.setAttribute('title', 'Click to view recent changes');
                saveStatus.style.cursor = 'pointer';
            } else {
                saveStatus.setAttribute('title', 'All changes saved');
                saveStatus.style.cursor = 'default';
            }
        }
        
        // Show/hide auto-save indicator and modified file count
        const saveAllBtn = document.getElementById('save-all-btn');
        if (saveAllBtn) {
            const modifiedCount = this.getModifiedFileCount();
            if (this.settings.autoSave) {
                saveAllBtn.title = `Save all modified files${modifiedCount > 0 ? ` (${modifiedCount})` : ''}`;
            } else {
                saveAllBtn.title = `Save all modified files${modifiedCount > 0 ? ` (${modifiedCount})` : ''} - Auto-save is disabled`;
                if (modifiedCount > 0) {
                    saveAllBtn.classList.add('pulse-highlight');
                } else {
                    saveAllBtn.classList.remove('pulse-highlight');
                }
            }
        }
    }
    
    /**
     * Sanitize internal name by replacing spaces with configured separator
     */
    sanitizeInternalName(name) {
        if (!name) return name;
        const separator = this.settings.internalNameSeparator || '_';
        // Replace spaces with separator and remove other invalid characters
        return name.replace(/\s+/g, separator)
                   .replace(/[^a-zA-Z0-9_\-\.]/g, '')
                   .trim();
    }
    
    /**
     * Show alert dialog (replacement for native alert)
     */
    showAlert(message, type = 'info', title = null) {
        // Auto-determine title based on type if not provided
        if (!title) {
            const titles = {
                'error': 'Error',
                'warning': 'Warning',
                'success': 'Success',
                'info': 'Notice'
            };
            title = titles[type] || 'Notice';
        }
        
        return new Promise((resolve) => {
            const okAction = () => {
                resolve(true);
            };
            
            // Determine icon based on type
            const icons = {
                'error': 'fa-exclamation-circle',
                'warning': 'fa-exclamation-triangle',
                'success': 'fa-check-circle',
                'info': 'fa-info-circle'
            };
            const icon = icons[type] || 'fa-info-circle';
            
            this.createModal(title, `
                <div class="alert-message-container">
                    <i class="fas ${icon} alert-icon alert-icon-${type}"></i>
                    <p class="alert-message">${message}</p>
                </div>
            `, [
                { label: 'OK', class: 'btn-primary', action: okAction }
            ], `modal-alert modal-alert-${type}`);
            
            // Add keyboard shortcuts
            setTimeout(() => {
                const keyHandler = (e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                        e.preventDefault();
                        okAction();
                        this.closeModal();
                        document.removeEventListener('keydown', keyHandler);
                    }
                };
                document.addEventListener('keydown', keyHandler);
            }, 100);
        });
    }
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, duration);
    }
    
    /**
     * Show celebration message with fireworks in the center of screen
     */
    showCelebrationMessage(message, duration = 3000) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            background: rgba(0, 0, 0, 0.3);
        `;
        
        // Create message container
        const messageBox = document.createElement('div');
        messageBox.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem 3rem;
            border-radius: 15px;
            font-size: 1.5rem;
            font-weight: bold;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: celebrationPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            position: relative;
        `;
        messageBox.textContent = message;
        
        // Add fireworks animation style if not exists
        if (!document.getElementById('celebration-styles')) {
            const style = document.createElement('style');
            style.id = 'celebration-styles';
            style.textContent = `
                @keyframes celebrationPop {
                    0% { transform: scale(0.5); opacity: 0; }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes firework {
                    0% { transform: translate(0, 0) scale(0); opacity: 1; }
                    100% { transform: translate(var(--tx), var(--ty)) scale(1); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Create fireworks particles
        for (let i = 0; i < 30; i++) {
            const firework = document.createElement('div');
            const angle = (Math.PI * 2 * i) / 30;
            const distance = 150 + Math.random() * 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            firework.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: ${['#ff0', '#f0f', '#0ff', '#ff0', '#0f0', '#f00'][Math.floor(Math.random() * 6)]};
                border-radius: 50%;
                top: 50%;
                left: 50%;
                animation: firework 1s ease-out forwards;
                animation-delay: ${Math.random() * 0.2}s;
                --tx: ${tx}px;
                --ty: ${ty}px;
            `;
            messageBox.appendChild(firework);
        }
        
        overlay.appendChild(messageBox);
        document.body.appendChild(overlay);
        
        // Remove after duration
        setTimeout(() => {
            overlay.style.transition = 'opacity 0.3s';
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }, duration);
    }
    
    /**
     * Show prompt dialog
     */
    showPrompt(title, message, defaultValue = '') {
        return new Promise((resolve) => {
            const submitAction = () => {
                const value = document.getElementById('prompt-input')?.value;
                resolve(value);
            };
            
            const cancelAction = () => {
                resolve(null);
            };
            
            this.createModal(title, `
                <div class="form-group">
                    <label class="form-label">${message}</label>
                    <input type="text" class="form-input" id="prompt-input" value="${defaultValue}" placeholder="Enter a name...">
                </div>
            `, [
                { label: 'Cancel', class: 'btn-secondary', action: cancelAction },
                { label: 'OK', class: 'btn-primary', action: submitAction }
            ], 'modal-prompt');
            
            // Focus input and setup keyboard shortcuts
            setTimeout(() => {
                const input = document.getElementById('prompt-input');
                if (input) {
                    input.focus();
                    input.select(); // Auto-select text for easy overwriting
                    
                    // Enter key to submit
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            submitAction();
                            this.closeModal();
                        } else if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelAction();
                            this.closeModal();
                        }
                    });
                }
            }, 100);
        });
    }
    
    /**
     * Show confirm dialog
     */
    showConfirmDialog(title, message, optionsOrConfirmLabel = 'OK', cancelLabel = 'Cancel') {
        return new Promise((resolve) => {
            let buttons;
            // Declare confirmAction and cancelAction in function scope for keyboard handler access
            let confirmAction = () => resolve(true);
            let cancelAction = () => resolve(false);
            
            // Check if third parameter is an array of options or a simple string
            if (Array.isArray(optionsOrConfirmLabel)) {
                // New format: array of {text, value, primary} objects
                buttons = optionsOrConfirmLabel.map(option => ({
                    label: option.text,
                    class: option.primary ? 'btn-primary' : 'btn-secondary',
                    action: () => resolve(option.value)
                }));
                // For arrays, Enter triggers first primary option
                const primaryOption = optionsOrConfirmLabel.find(o => o.primary);
                if (primaryOption) {
                    confirmAction = () => resolve(primaryOption.value);
                }
            } else if (typeof optionsOrConfirmLabel === 'object' && optionsOrConfirmLabel.confirmText) {
                // Old format with options object: {confirmText, cancelText, showCancel}
                confirmAction = () => resolve(true);
                cancelAction = () => resolve(optionsOrConfirmLabel.showCancel ? null : false);
                
                buttons = [
                    { label: optionsOrConfirmLabel.cancelText || 'Cancel', class: 'btn-secondary', action: cancelAction },
                    { label: optionsOrConfirmLabel.confirmText || 'OK', class: 'btn-primary', action: confirmAction }
                ];
            } else {
                // Legacy format: simple confirm/cancel
                confirmAction = () => resolve(true);
                cancelAction = () => resolve(false);
                
                buttons = [
                    { label: cancelLabel, class: 'btn-secondary', action: cancelAction },
                    { label: optionsOrConfirmLabel, class: 'btn-primary', action: confirmAction }
                ];
            }
            
            this.createModal(title, `
                <div class="form-group">
                    <p>${message}</p>
                </div>
            `, buttons, 'modal-confirm');
            
            // Add keyboard shortcuts
            setTimeout(() => {
                const modal = document.querySelector('.modal-confirm');
                if (modal) {
                    // Focus the modal for keyboard events
                    modal.setAttribute('tabindex', '-1');
                    modal.focus();
                    
                    const keyHandler = (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            confirmAction();
                            this.closeModal();
                            document.removeEventListener('keydown', keyHandler);
                        } else if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelAction();
                            this.closeModal();
                            document.removeEventListener('keydown', keyHandler);
                        }
                    };
                    
                    document.addEventListener('keydown', keyHandler);
                }
            }, 100);
        });
    }
    
    /**
     * Create modal dialog
     */
    createModal(title, bodyHTML, buttons = [], modalClass = '') {
        const container = document.getElementById('modal-container');
        
        if (!container) {
            console.error('Modal container not found');
            return;
        }
        
        const buttonsHTML = buttons.map(btn => 
            `<button class="btn ${btn.class}" data-action="${btn.label}">${btn.label}</button>`
        ).join('');
        
        const modalHTML = `
            <div class="modal-overlay">
                <div class="modal ${modalClass}">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="icon-btn" id="close-modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">${bodyHTML}</div>
                    <div class="modal-footer">${buttonsHTML}</div>
                </div>
            </div>
        `;
        
        container.innerHTML = modalHTML;
        
        const overlay = container.querySelector('.modal-overlay');
        
        // Setup button actions
        buttons.forEach(btn => {
            const element = container.querySelector(`[data-action="${btn.label}"]`);
            if (element) {
                element.addEventListener('click', () => {
                    btn.action();
                    this.closeModal();
                });
            }
        });
        
        // Close button
        container.querySelector('#close-modal')?.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Close on overlay click (but not on modal content click)
        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeModal();
            }
        });
        
        // Add keyboard support for modals with primary buttons
        setTimeout(() => {
            const primaryBtn = container.querySelector('.btn-primary');
            const secondaryBtn = container.querySelector('.btn-secondary');
            
            if (primaryBtn && !modalClass.includes('modal-prompt')) { // prompt already has its own handler
                const keyHandler = (e) => {
                    const modal = container.querySelector('.modal');
                    if (!modal) return; // Modal was closed
                    
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        primaryBtn.click();
                    } else if (e.key === 'Escape' && secondaryBtn) {
                        e.preventDefault();
                        secondaryBtn.click();
                    }
                };
                
                document.addEventListener('keydown', keyHandler);
                
                // Store handler for cleanup
                if (!container._keyHandlers) container._keyHandlers = [];
                container._keyHandlers.push(keyHandler);
            }
        }, 50);
        
        return container;
    }
    
    /**
     * Close modal dialog
     */
    closeModal() {
        const container = document.getElementById('modal-container');
        if (container) {
            // Clean up keyboard handlers
            if (container._keyHandlers) {
                container._keyHandlers.forEach(handler => {
                    document.removeEventListener('keydown', handler);
                });
                container._keyHandlers = [];
            }
            container.innerHTML = '';
        }
    }
    
    /**
     * Close context menu
     */
    closeContextMenu() {
        const menu = document.getElementById('context-menu');
        if (menu) {
            menu.classList.add('hidden');
        }
    }
    
    /**
     * Show all keyboard shortcuts modal
     */
    showAllShortcuts() {
        // Create shortcuts modal with new design
        // NOTE: Shortcuts use Alt for panel toggles to avoid browser conflicts
        const shortcutsData = [
            {
                category: 'File Operations',
                icon: 'fa-file-alt',
                color: '#3b82f6',
                shortcuts: [
                    { keys: ['Ctrl', 'S'], desc: 'Save changes' },
                    { keys: ['Ctrl', 'E'], desc: 'Export to YAML' },
                    { keys: ['Ctrl', 'Shift', 'O'], desc: 'Import YAML' }
                ]
            },
            {
                category: 'Create New',
                icon: 'fa-plus-circle',
                color: '#10b981',
                shortcuts: [
                    { keys: ['Ctrl', 'N'], desc: 'New Mob' },
                    { keys: ['Ctrl', 'Shift', 'M'], desc: 'New Skill' },
                    { keys: ['Ctrl', 'Shift', 'I'], desc: 'New Item' },
                    { keys: ['Ctrl', 'Shift', 'T'], desc: 'New DropTable' },
                    { keys: ['Ctrl', 'Shift', 'R'], desc: 'New RandomSpawn' },
                    { keys: ['Ctrl', 'Shift', 'S'], desc: 'New Spawner' },
                    { keys: ['Ctrl', 'Shift', 'P'], desc: 'Browse Templates' },
                    { keys: ['Ctrl', 'Shift', 'H'], desc: 'Placeholder Browser' }
                ]
            },
            {
                category: 'Quick Access',
                icon: 'fa-bolt',
                color: '#f59e0b',
                shortcuts: [
                    { keys: ['Ctrl', 'K'], desc: 'Command Palette' },
                    { keys: ['F1'], desc: 'Show Help' },
                    { keys: ['Esc'], desc: 'Close panels/modals' }
                ]
            },
            {
                category: 'Editing',
                icon: 'fa-edit',
                color: '#8b5cf6',
                shortcuts: [
                    { keys: ['Ctrl', 'Z'], desc: 'Undo' },
                    { keys: ['Ctrl', 'Y'], desc: 'Redo' },
                    { keys: ['Ctrl', 'Shift', 'F'], desc: 'Format selected line' }
                ]
            },
            {
                category: 'Toggle Panels',
                icon: 'fa-columns',
                color: '#ec4899',
                shortcuts: [
                    { keys: ['Alt', 'D'], desc: 'Toggle duplicates panel' },
                    { keys: ['Alt', 'G'], desc: 'Toggle grouped view' },
                    { keys: ['Alt', 'A'], desc: 'Toggle analysis panel' },
                    { keys: ['Alt', 'V'], desc: 'Toggle validation panel' },
                    { keys: ['Ctrl', 'Shift', 'D'], desc: 'Toggle dependencies panel' }
                ]
            }
        ];
        
        const modalHTML = `
            <div class="shortcuts-modal-new">
                <div class="shortcuts-grid-new">
                    ${shortcutsData.map(cat => `
                        <div class="shortcut-category-card">
                            <div class="shortcut-category-header" style="--cat-color: ${cat.color}">
                                <i class="fas ${cat.icon}"></i>
                                <span>${cat.category}</span>
                            </div>
                            <div class="shortcut-category-list">
                                ${cat.shortcuts.map(s => `
                                    <div class="shortcut-entry">
                                        <span class="shortcut-keys-new">${s.keys.map(k => `<kbd>${k}</kbd>`).join('')}</span>
                                        <span class="shortcut-desc-new">${s.desc}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="shortcuts-footer-note">
                    <i class="fas fa-info-circle"></i>
                    <span>Some shortcuts are context-specific and only work in certain editors.</span>
                </div>
            </div>
        `;
        
        this.createModal('Keyboard Shortcuts', modalHTML, [], 'modal-large shortcuts-modal-container');
    }
    
    /**
     * Show help dialog
     */
    showHelp() {
        const modalHTML = `
            <div class="help-modal-content">
                <div class="help-tabs">
                    <button class="help-tab active" data-tab="getting-started">
                        <i class="fas fa-rocket"></i> Getting Started
                    </button>
                    <button class="help-tab" data-tab="shortcuts">
                        <i class="fas fa-keyboard"></i> Shortcuts
                    </button>
                    <button class="help-tab" data-tab="faq">
                        <i class="fas fa-question-circle"></i> FAQ
                    </button>
                    <button class="help-tab" data-tab="resources">
                        <i class="fas fa-book"></i> Resources
                    </button>
                </div>
                
                <div class="help-panel active" data-panel="getting-started">
                    <h3><i class="fas fa-play-circle"></i> Quick Start Guide</h3>
                    <div class="help-steps">
                        <div class="help-step">
                            <span class="step-number">1</span>
                            <div class="step-content">
                                <strong>Create a Pack</strong>
                                <p>Click <kbd>+ New Pack</kbd> in the left sidebar to create your first pack.</p>
                            </div>
                        </div>
                        <div class="help-step">
                            <span class="step-number">2</span>
                            <div class="step-content">
                                <strong>Add Content</strong>
                                <p>Use the buttons to add Mobs, Skills, Items, or Drop Tables to your pack.</p>
                            </div>
                        </div>
                        <div class="help-step">
                            <span class="step-number">3</span>
                            <div class="step-content">
                                <strong>Configure</strong>
                                <p>Fill in the forms to customize your content. The YAML preview updates in real-time.</p>
                            </div>
                        </div>
                        <div class="help-step">
                            <span class="step-number">4</span>
                            <div class="step-content">
                                <strong>Export</strong>
                                <p>Right-click your pack and select "Export as ZIP" to download all your files.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="help-tip">
                        <i class="fas fa-lightbulb"></i>
                        <div>
                            <strong>Pro Tip:</strong> Press <kbd>Ctrl+K</kbd> to open the command palette for quick actions!
                        </div>
                    </div>
                </div>
                
                <div class="help-panel" data-panel="shortcuts">
                    <h3><i class="fas fa-keyboard"></i> Keyboard Shortcuts</h3>
                    <div class="shortcuts-grid">
                        <div class="shortcut-group">
                            <h4>General</h4>
                            <div class="shortcut-item"><kbd>Ctrl+K</kbd> <span>Command Palette</span></div>
                            <div class="shortcut-item"><kbd>Ctrl+S</kbd> <span>Save Current File</span></div>
                            <div class="shortcut-item"><kbd>Ctrl+Shift+S</kbd> <span>Save All</span></div>
                            <div class="shortcut-item"><kbd>Esc</kbd> <span>Close Modal/Cancel</span></div>
                        </div>
                        <div class="shortcut-group">
                            <h4>Navigation</h4>
                            <div class="shortcut-item"><kbd>Ctrl+1</kbd> <span>Focus Packs Panel</span></div>
                            <div class="shortcut-item"><kbd>Ctrl+2</kbd> <span>Focus Editor</span></div>
                            <div class="shortcut-item"><kbd>Ctrl+3</kbd> <span>Focus YAML Preview</span></div>
                        </div>
                        <div class="shortcut-group">
                            <h4>Creation</h4>
                            <div class="shortcut-item"><kbd>Ctrl+N</kbd> <span>New Pack</span></div>
                            <div class="shortcut-item"><kbd>Ctrl+Shift+M</kbd> <span>New Mob</span></div>
                            <div class="shortcut-item"><kbd>Ctrl+Shift+K</kbd> <span>New Skill</span></div>
                            <div class="shortcut-item"><kbd>Ctrl+Shift+I</kbd> <span>New Item</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="help-panel" data-panel="faq">
                    <h3><i class="fas fa-question-circle"></i> Frequently Asked Questions</h3>
                    <div class="faq-list">
                        <details class="faq-item">
                            <summary>Where is my data saved?</summary>
                            <p>Your packs are saved locally in your browser's localStorage. If you create an account, you can sync them to the cloud.</p>
                        </details>
                        <details class="faq-item">
                            <summary>Will I lose my data if I clear my browser?</summary>
                            <p>Yes! Always export your packs regularly as a backup. Cloud sync helps prevent data loss.</p>
                        </details>
                        <details class="faq-item">
                            <summary>What's the difference between Beginner and Advanced mode?</summary>
                            <p>Beginner mode shows essential options. Advanced mode unlocks all MythicMobs features like BossBar, AI, Modules, and more.</p>
                        </details>
                        <details class="faq-item">
                            <summary>How do I import existing MythicMobs configs?</summary>
                            <p>Use File > Import, then select "Import Pack Folder" to import an entire MythicMobs pack with full analysis.</p>
                        </details>
                        <details class="faq-item">
                            <summary>Is this tool affiliated with MythicMobs?</summary>
                            <p>No. This is an independent community project by AlternativeSoap. Please do not contact MythicMobs authors for support.</p>
                        </details>
                    </div>
                </div>
                
                <div class="help-panel" data-panel="resources">
                    <h3><i class="fas fa-book"></i> Helpful Resources</h3>
                    <div class="resources-grid">
                        <a href="https://git.mythiccraft.io/mythiccraft/MythicMobs/-/wikis/home" target="_blank" rel="noopener" class="resource-card">
                            <i class="fas fa-book-open"></i>
                            <div>
                                <strong>MythicMobs Wiki</strong>
                                <p>Official documentation for all mechanics, conditions, and targeters</p>
                            </div>
                        </a>
                        <a href="https://github.com/AlternativeSoap/Soaps-MythicMobs-Editor/issues" target="_blank" rel="noopener" class="resource-card">
                            <i class="fab fa-github"></i>
                            <div>
                                <strong>Report Issues</strong>
                                <p>Found a bug? Report it on GitHub</p>
                            </div>
                        </a>
                        <a href="https://discord.gg/mythiccraft" target="_blank" rel="noopener" class="resource-card">
                            <i class="fab fa-discord"></i>
                            <div>
                                <strong>MythicCraft Discord</strong>
                                <p>Community support for MythicMobs (not this editor)</p>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        this.createModal('Help & Documentation', modalHTML, [
            { label: 'Close', class: 'btn-primary', action: () => {} }
        ], 'modal-large help-modal-container');
        
        // Setup tab switching
        setTimeout(() => {
            const tabs = document.querySelectorAll('.help-tab');
            const panels = document.querySelectorAll('.help-panel');
            
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetPanel = tab.dataset.tab;
                    
                    tabs.forEach(t => t.classList.remove('active'));
                    panels.forEach(p => p.classList.remove('active'));
                    
                    tab.classList.add('active');
                    document.querySelector(`[data-panel="${targetPanel}"]`)?.classList.add('active');
                });
            });
        }, 100);
    }
    
    /**
     * Show import dialog - allows importing YAML or full packs
     */
    showImportDialog() {
        this.createModal('Import', `
            <div class="import-options">
                <p style="margin-bottom: 16px; color: #94a3b8;">Choose how you want to import:</p>
                <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                    <button class="action-card" id="import-yaml-file" style="flex: 1; min-width: 200px;">
                        <i class="fas fa-file-code"></i>
                        <h3>Import YAML File</h3>
                        <p>Import a single YAML file</p>
                    </button>
                    <button class="action-card" id="import-pack-folder" style="flex: 1; min-width: 200px;">
                        <i class="fas fa-folder-open"></i>
                        <h3>Import Pack Folder</h3>
                        <p>Import entire MythicMobs packs with full analysis</p>
                    </button>
                </div>
            </div>
        `, [
            { label: 'Cancel', class: 'btn-secondary', action: () => {} }
        ]);
        
        // Setup import options
        document.getElementById('import-yaml-file')?.addEventListener('click', () => {
            this.closeModal();
            this.importYAMLFile();
        });
        
        document.getElementById('import-pack-folder')?.addEventListener('click', () => {
            this.closeModal();
            this.importPack();
        });
    }
    
    /**
     * Import a single YAML file
     */
    async importYAMLFile() {
        if (!this.state.currentPack) {
            this.showToast('Please select a pack first', 'warning');
            return;
        }
        
        try {
            // Create file input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.yml,.yaml';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const text = await file.text();
                
                try {
                    // Parse YAML using js-yaml
                    const data = jsyaml.load(text);
                    
                    if (!data || typeof data !== 'object') {
                        throw new Error('Invalid YAML structure');
                    }
                    
                    // Try to detect what type of file this is
                    const entries = Object.entries(data);
                    if (entries.length === 0) {
                        throw new Error('Empty YAML file');
                    }
                    
                    // Check first entry to determine type
                    const [name, content] = entries[0];
                    let fileType = this.detectYAMLFileType(content);
                    
                    // Ask user to confirm type
                    const confirmed = await this.showTypeConfirmDialog(name, fileType);
                    if (!confirmed) return;
                    
                    // Import all entries
                    let importedCount = 0;
                    for (const [entryName, entryData] of entries) {
                        this.importYAMLEntry(entryName, entryData, fileType);
                        importedCount++;
                    }
                    
                    this.showToast(`Imported ${importedCount} ${fileType}(s) successfully`, 'success');
                    this.packManager.renderPackTree();
                    
                } catch (error) {
                    console.error('Failed to parse YAML:', error);
                    this.showToast(`Failed to parse YAML: ${error.message}`, 'error');
                }
            };
            
            input.click();
            
        } catch (error) {
            console.error('Import failed:', error);
            this.showToast('Import failed', 'error');
        }
    }
    
    /**
     * Detect the type of a YAML entry
     */
    detectYAMLFileType(content) {
        if (!content || typeof content !== 'object') return 'mob';
        
        // Skills have specific keys
        if (content.Skills && Array.isArray(content.Skills)) return 'skill';
        if (content.Conditions && !content.Type) return 'skill';
        
        // Items have specific keys
        if (content.Id || content.Material || content.Enchantments) return 'item';
        
        // DropTables have Drops array
        if (content.Drops && Array.isArray(content.Drops)) return 'droptable';
        
        // RandomSpawns have specific keys
        if (content.MobType && (content.Worlds || content.Biomes)) return 'randomspawn';
        
        // Default to mob (most have Type)
        return 'mob';
    }
    
    /**
     * Show dialog to confirm file type
     */
    showTypeConfirmDialog(name, detectedType) {
        return new Promise((resolve) => {
            this.createModal('Confirm Import Type', `
                <div class="form-group">
                    <p>Detected type for "${name}": <strong>${detectedType}</strong></p>
                    <label class="form-label" style="margin-top: 16px;">Import as:</label>
                    <select class="form-select" id="import-type-select">
                        <option value="mob" ${detectedType === 'mob' ? 'selected' : ''}>Mob</option>
                        <option value="skill" ${detectedType === 'skill' ? 'selected' : ''}>Skill</option>
                        <option value="item" ${detectedType === 'item' ? 'selected' : ''}>Item</option>
                        <option value="droptable" ${detectedType === 'droptable' ? 'selected' : ''}>DropTable</option>
                        <option value="randomspawn" ${detectedType === 'randomspawn' ? 'selected' : ''}>RandomSpawn</option>
                    </select>
                </div>
            `, [
                { label: 'Cancel', class: 'btn-secondary', action: () => resolve(null) },
                { label: 'Import', class: 'btn-primary', action: () => {
                    const select = document.getElementById('import-type-select');
                    resolve(select?.value || detectedType);
                }}
            ]);
        });
    }
    
    /**
     * Import a single YAML entry into the current pack
     */
    importYAMLEntry(name, data, type) {
        const pack = this.state.currentPack;
        if (!pack) return;
        
        // Initialize array if needed
        const pluralType = type + 's';
        if (!pack[pluralType]) {
            pack[pluralType] = [];
        }
        
        // Check if entry already exists
        const existingIndex = pack[pluralType].findIndex(e => e.name === name);
        
        const entry = {
            name,
            ...data,
            modified: true,
            isNew: existingIndex === -1
        };
        
        if (existingIndex !== -1) {
            // Update existing
            pack[pluralType][existingIndex] = entry;
        } else {
            // Add new
            pack[pluralType].push(entry);
        }
        
        // Save pack
        this.storage.set(`pack_${pack.name}`, pack);
    }
    
    /**
     * Import pack - Opens the advanced pack folder importer
     */
    importPack() {
        try {
            // Check required classes
            const requiredClasses = [
                'PackImporter',
                'PackFolderScanner', 
                'YamlFileParser',
                'DataValidator',
                'ImportPreviewUI',
                'ImportExecutor',
                'ImportReportGenerator'
            ];
            const missingClasses = [];
            for (const className of requiredClasses) {
                const available = typeof window[className] !== 'undefined';
                if (!available) missingClasses.push(className);
            }
            
            if (missingClasses.length > 0) {
                const errorMsg = `Missing required classes: ${missingClasses.join(', ')}.\n\nMake sure all packImporter scripts are loaded correctly.`;
                console.error(errorMsg);
                window.notificationModal?.alert(
                    errorMsg,
                    'error',
                    'Missing Components'
                );
                return;
            }
            
            // Check js-yaml library
            const jsyamlAvailable = typeof jsyaml !== 'undefined';
            if (!jsyamlAvailable) {
                window.notificationModal?.alert(
                    'js-yaml library not loaded. Check your internet connection and try refreshing the page.',
                    'error',
                    'Library Not Loaded'
                );
                return;
            }
            
            // Initialize pack importer if not already done
            if (!window.packImporter) {
                window.packImporter = new PackImporter();
            }
            
            // Start the import process
            window.packImporter.startImport();
            
        } catch (error) {
            console.error('Error in importPack:', error);
            window.notificationModal?.alert(
                'Error initializing pack importer: ' + error.message + '\n\nCheck console (F12) for details.',
                'error',
                'Initialization Error'
            );
        }
    }
    
    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Show dependency graph analysis
     */
    showDependencyGraph() {
        if (!this.state.currentPack) {
            this.showToast('Please select a pack first', 'warning');
            return;
        }
        
        // Build and analyze graph
        this.dependencyGraph.buildGraph(this.state.currentPack);
        
        // Show visualization
        this.dependencyGraph.showVisualization();
        
        this.showToast('Dependency graph generated', 'success');
    }
    
    /**
     * Toggle tools dropdown menu
     */
    toggleToolsDropdown() {
        const toolsBtn = document.getElementById('tools-btn');
        const dropdown = document.getElementById('tools-dropdown');
        
        if (!toolsBtn || !dropdown) return;
        
        const isActive = toolsBtn.classList.contains('active');
        
        if (isActive) {
            this.closeToolsDropdown();
        } else {
            toolsBtn.classList.add('active');
            dropdown.classList.add('active');
        }
    }
    
    /**
     * Close tools dropdown menu
     */
    closeToolsDropdown() {
        const toolsBtn = document.getElementById('tools-btn');
        const dropdown = document.getElementById('tools-dropdown');
        
        if (!toolsBtn || !dropdown) return;
        
        toolsBtn.classList.remove('active');
        dropdown.classList.remove('active');
    }
    
    /**
     * Open a specific tool from the dropdown
     * @param {string} tool - Tool identifier
     */
    openTool(tool) {
        switch (tool) {
            case 'statistics':
                this.showPackStatistics();
                break;
            case 'dependency':
                this.showDependencyGraph();
                break;
            case 'duplicates':
                this.showDuplicateDetector();
                break;
            case 'validator':
                this.showPackValidator();
                break;
            case 'usage':
                this.showSkillUsageReport();
                break;
            case 'backup':
                this.showBackupManager();
                break;
            case 'settings':
                this.showSettings();
                break;
            case 'help':
                this.showHelp();
                break;
            case 'about':
                this.showAbout();
                break;
            default:
                console.warn('Unknown tool:', tool);
        }
    }
    
    /**
     * Show help documentation
     */
    showHelp() {
        // Open help modal or documentation
        if (this.documentationHelper) {
            this.documentationHelper.show();
        } else {
            // Fallback: open external docs
            window.open('https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/home', '_blank');
        }
    }
    
    /**
     * Show about dialog
     */
    showAbout() {
        this.showModal({
            title: 'About Soaps MythicMobs Editor',
            content: `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-dragon" style="font-size: 3rem; color: var(--accent-primary); margin-bottom: 16px;"></i>
                    <h3 style="margin: 0 0 8px 0;">Soaps MythicMobs Editor</h3>
                    <p style="color: var(--text-secondary); margin: 0 0 16px 0;">Version 2.0.0</p>
                    <p style="color: var(--text-tertiary); font-size: 0.875rem; margin: 0;">
                        A powerful visual editor for creating MythicMobs configurations.<br>
                        Built with ❤️ for the Minecraft community.
                    </p>
                    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-primary);">
                        <a href="https://github.com" target="_blank" style="color: var(--accent-primary); text-decoration: none; margin: 0 8px;">
                            <i class="fab fa-github"></i> GitHub
                        </a>
                        <a href="https://discord.gg/mythicmobs" target="_blank" style="color: var(--accent-primary); text-decoration: none; margin: 0 8px;">
                            <i class="fab fa-discord"></i> Discord
                        </a>
                    </div>
                </div>
            `,
            showCancel: false,
            confirmText: 'Close'
        });
    }
    
    /**
     * Show pack statistics tool
     */
    showPackStatistics() {
        if (!this.state.currentPack) {
            this.showToast('Please select a pack first', 'warning');
            return;
        }
        
        this.packStatistics.show(this.state.currentPack);
    }
    
    /**
     * Show duplicate detector tool
     */
    showDuplicateDetector() {
        if (!this.state.currentPack) {
            this.showToast('Please select a pack first', 'warning');
            return;
        }
        
        this.duplicateDetector.analyze(this.state.currentPack);
    }
    
    /**
     * Show pack validator tool
     */
    showPackValidator() {
        if (!this.state.currentPack) {
            this.showToast('Please select a pack first', 'warning');
            return;
        }
        
        this.packValidator.validate(this.state.currentPack);
    }
    
    /**
     * Show skill usage report tool
     */
    showSkillUsageReport() {
        if (!this.state.currentPack) {
            this.showToast('Please select a pack first', 'warning');
            return;
        }
        
        this.skillUsageReport.generate(this.state.currentPack);
    }
    
    /**
     * Show backup manager tool
     */
    showBackupManager() {
        this.backupManager.show();
    }
    
    /**
     * Show mode comparison modal
     */
    showModeComparison() {
        const modal = document.getElementById('mode-comparison-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }
    
    /**
     * Close mode comparison modal
     */
    closeModeComparison() {
        const modal = document.getElementById('mode-comparison-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Export for use in other modules
window.MythicMobsEditor = MythicMobsEditor;
