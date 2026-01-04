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
window.DEBUG_MODE = false;

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
            currentMode: 'beginner',          // 'beginner' or 'advanced'
            currentPack: null,                // Active pack object
            currentFile: null,                // Currently open file
            currentFileType: null,            // 'mob', 'skill', or 'item'
            currentView: 'dashboard',         // Current view name
            isDirty: false,                   // Unsaved changes flag
            autoSave: false,                  // Auto-save disabled by default
            livePreview: true,                // Live YAML preview enabled
            sidebarLeftCollapsed: false,
            sidebarRightCollapsed: false
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
            this.commandPalette = new CommandPalette(this);
            
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
        document.getElementById('quick-template-browser')?.addEventListener('click', () => this.openTemplateBrowser());
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
        document.getElementById('save-status')?.addEventListener('click', (e) => this.toggleRecentChanges(e));
        document.getElementById('view-all-changes-btn')?.addEventListener('click', () => this.showChangeHistory());
        document.getElementById('close-history-modal')?.addEventListener('click', () => this.closeChangeHistory());
        document.getElementById('clear-history-btn')?.addEventListener('click', () => this.clearChangeHistory());
        document.getElementById('history-search')?.addEventListener('input', (e) => this.filterChangeHistory(e.target.value));
        
        // Click outside to close recent changes dropdown
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('recent-changes-dropdown');
            const saveStatus = document.getElementById('save-status');
            if (dropdown && !dropdown.classList.contains('hidden') && 
                !dropdown.contains(e.target) && !saveStatus.contains(e.target)) {
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
        // Hide all editor views
        document.querySelectorAll('.view-container').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show dashboard
        const dashboardView = document.getElementById('dashboard-view');
        if (dashboardView) {
            dashboardView.classList.add('active');
        }
        
        // Update state
        this.state.currentView = 'dashboard';
        this.state.currentFile = null;
        this.state.currentFileType = null;
        
        // Update breadcrumb
        this.updateBreadcrumb();
        
        // Hide home button when on dashboard
        const homeBtn = document.getElementById('breadcrumb-home');
        if (homeBtn) {
            homeBtn.style.display = 'none';
        }
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
        // Check for manual edits in the preview panel
        if (this._previewHasManualEdits && this._previewElement) {
            const currentContent = this._previewElement.textContent;
            
            if (currentContent !== this._originalPreviewContent) {
                const result = await this.showConfirmDialog(
                    'You have unsaved manual edits in the YAML preview panel. What would you like to do?',
                    'Unsaved YAML Preview Edits',
                    [
                        { text: 'Apply & Switch', value: 'apply', primary: true },
                        { text: 'Discard & Switch', value: 'discard' },
                        { text: 'Cancel', value: 'cancel' }
                    ]
                );
                
                if (result === 'cancel') {
                    return; // Don't switch modes
                } else if (result === 'apply') {
                    await this.applyManualYAMLEdits(currentContent);
                }
                this._previewHasManualEdits = false;
            }
        }
        
        const wasBeginnerMode = this.state.currentMode === 'beginner';
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
        
        // Re-render current editor
        if (this.state.currentFile) {
            this.openFile(this.state.currentFile, this.state.currentFileType);
        }
        
        this.showToast(`Switched to ${mode} mode`, 'info');
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
        this.markDirty();
        
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
            this.markDirty();
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
        this.markDirty();
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
        this.markDirty();
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
        this.markDirty();
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
        this.markDirty();
        
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
        // Check for unsaved manual edits in preview panel before opening new file
        if (this._previewHasManualEdits && this._previewElement) {
            const currentContent = this._previewElement.textContent;
            if (currentContent !== this._originalPreviewContent) {
                const result = await this.showConfirmDialog(
                    'You have unsaved manual edits in the YAML preview panel. What would you like to do?',
                    'Unsaved YAML Preview Edits',
                    [
                        { text: 'Apply & Open', value: 'apply', primary: true },
                        { text: 'Discard & Open', value: 'discard' },
                        { text: 'Cancel', value: 'cancel' }
                    ]
                );
                
                if (result === 'cancel') {
                    return; // Don't open new file
                } else if (result === 'apply') {
                    await this.applyManualYAMLEdits(currentContent);
                }
                this._previewHasManualEdits = false;
            }
        }
        
        // Save current file if dirty and auto-save is enabled
        if (this.state.isDirty && this.settings.autoSave && this.state.currentFile) {
            try {
                await this.save();
            } catch (error) {
                console.error('Failed to auto-save before switching files:', error);
            }
        }
        
        // Update state
        this.state.currentFile = file;
        this.state.currentFileType = type;
        this.state.currentView = `${type}-editor`;
        
        // Add to recent files
        if (file && file.id && type !== 'packinfo' && type !== 'tooltips') {
            const fileName = file.internalName || file.name || 'Unnamed';
            const packName = this.state.currentPack?.name || 'Unknown Pack';
            this.packManager.addToRecentFiles(file.id, fileName, type, packName);
        }
        
        // Hide all views
        document.querySelectorAll('.view-container').forEach(view => {
            view.classList.remove('active');
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
            
            // Only clear isDirty if no other files are modified
            const hasOtherModifiedFiles = this.hasModifiedFiles();
            this.state.isDirty = hasOtherModifiedFiles;
            
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
            if (files.some(file => file.modified || file.isNew)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Get count of modified files
     */
    getModifiedFileCount() {
        if (!this.state.currentPack) return 0;
        
        const fileTypes = ['mobs', 'skills', 'items', 'droptables', 'randomspawns'];
        let count = 0;
        
        fileTypes.forEach(type => {
            const files = this.state.currentPack[type] || [];
            count += files.filter(file => file.modified || file.isNew).length;
        });
        
        return count;
    }
    
    /**
     * Mark current state as dirty (unsaved changes)
     */
    markDirty() {
        this.state.isDirty = true;
        
        // Mark current file as modified for Save All
        if (this.state.currentFile) {
            this.state.currentFile.modified = true;
            this.state.currentFile.lastModified = new Date().toISOString();
        }
        
        // Add to change history if enabled
        if (this.settings.keepHistory && this.state.currentFile) {
            this.addToChangeHistory({
                fileName: this.state.currentFile.name,
                fileType: this.state.currentFileType,
                changeType: this.state.currentFile.isNew ? 'created' : 'modified'
            });
        }
        
        this.updateSaveStatusIndicator();
        
        // Schedule auto-save ONLY if enabled in settings
        if (this.settings.autoSave && this.state.currentFile) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = setTimeout(async () => {
                if (this.settings.autoSave) { // Double-check setting hasn't changed
                    try {
                        await this.save();
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
     */
    updateSaveStatusIndicator() {
        const status = document.querySelector('.save-status');
        const saveAllBtn = document.getElementById('save-all-btn');
        
        if (!status) return;
        
        const icon = status.querySelector('i');
        const text = status.querySelector('span');
        
        // Update status indicator
        if (this.state.isDirty) {
            status.classList.remove('saved', 'saving');
            status.classList.add('unsaved');
            icon.className = 'fas fa-exclamation-circle';
            text.textContent = 'Unsaved changes';
        } else {
            status.classList.remove('unsaved', 'saving');
            status.classList.add('saved');
            icon.className = 'fas fa-check-circle';
            text.textContent = 'All changes saved';
        }
        
        // Update Save All button state
        if (saveAllBtn) {
            const modifiedCount = this.getModifiedFileCount();
            saveAllBtn.disabled = modifiedCount === 0;
            if (modifiedCount > 0) {
                saveAllBtn.title = `Save all ${modifiedCount} modified file${modifiedCount > 1 ? 's' : ''} (Ctrl+Shift+S)`;
            } else {
                saveAllBtn.title = 'No modified files to save';
            }
        }
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
     */
    async saveAll() {
        if (!this.state.currentPack) {
            this.showToast('No pack is currently open', 'warning');
            return;
        }
        
        // Collect all modified files across all types
        const modifiedFiles = [];
        const fileTypes = ['mobs', 'skills', 'items', 'droptables', 'randomspawns'];
        
        fileTypes.forEach(type => {
            const files = this.state.currentPack[type] || [];
            files.forEach(file => {
                if (file.modified || file.isNew) {
                    modifiedFiles.push({ file, type: type.slice(0, -1) }); // Remove 's' from type
                }
            });
        });
        
        if (modifiedFiles.length === 0) {
            this.showToast('No files to save', 'info');
            return;
        }
        
        const saveAllBtn = document.getElementById('save-all-btn');
        
        // Disable button during save
        if (saveAllBtn) {
            saveAllBtn.disabled = true;
            saveAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        }
        
        this.showSavingStatus();
        let savedCount = 0;
        let errorCount = 0;
        const failedFiles = [];
        
        if (window.DEBUG_MODE) console.log(`💾 Saving ${modifiedFiles.length} modified file${modifiedFiles.length > 1 ? 's' : ''}...`);
        
        try {
            // Save each file individually with retry logic
            for (const { file, type } of modifiedFiles) {
                let saveSuccess = false;
                let retryCount = 0;
                const maxRetries = 3;
                
                while (!saveSuccess && retryCount < maxRetries) {
                    try {
                        await this.fileManager.saveFile(file, type, true); // true = immediate save
                        file.modified = false;
                        file.isNew = false;
                        file.lastSaved = new Date().toISOString();
                        savedCount++;
                        saveSuccess = true;
                        if (window.DEBUG_MODE) console.log(`✅ Saved: ${file.name}`);
                    } catch (error) {
                        retryCount++;
                        if (retryCount >= maxRetries) {
                            console.error(`Failed to save ${file.name}:`, error);
                            failedFiles.push(file.name);
                            errorCount++;
                        } else {
                            if (window.DEBUG_MODE) console.warn(`⚠️ Save attempt ${retryCount} for ${file.name} failed, retrying...`);
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    }
                }
            }
            
            // Update state - only clear isDirty if all files saved successfully
            this.state.isDirty = errorCount > 0;
            this.updateSaveStatusIndicator();
            this.packManager.refresh(); // Refresh tree to remove asterisks
            
            // Show summary
            if (errorCount === 0) {
                this.showToast(`✅ Successfully saved all ${savedCount} file${savedCount > 1 ? 's' : ''}`, 'success');
            } else {
                const failedList = failedFiles.join(', ');
                this.showToast(`⚠️ Saved ${savedCount} of ${modifiedFiles.length} files. Failed: ${failedList}`, 'warning');
            }
        } finally {
            // Re-enable button
            if (saveAllBtn) {
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
     * Toggle recent changes dropdown
     */
    toggleRecentChanges(e) {
        e.stopPropagation();
        // Only toggle dropdown in advanced mode
        if (this.state.currentMode !== 'advanced') return;
        
        const dropdown = document.getElementById('recent-changes-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
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
        
        // Check if user has manually edited the preview panel
        if (this._previewHasManualEdits) {
            const currentContent = preview.textContent;
            
            if (currentContent !== this._originalPreviewContent) {
                // Prompt user to apply or discard changes
                const result = await this.showConfirmDialog(
                    'You have unsaved manual edits in the YAML preview panel. What would you like to do?',
                    'Unsaved YAML Edits',
                    [
                        { text: 'Apply Changes', value: 'apply', primary: true },
                        { text: 'Discard Changes', value: 'discard' },
                        { text: 'Cancel', value: 'cancel' }
                    ]
                );
                
                if (result === 'cancel') {
                    return; // Don't update preview, keep manual edits
                } else if (result === 'apply') {
                    await this.applyManualYAMLEdits(currentContent);
                }
                // If 'discard', continue with normal preview update
            }
            this._previewHasManualEdits = false;
        }
        
        if (!this.state.currentFile) {
            preview.textContent = '# Select an item to see YAML preview';
            return;
        }
        
        try {
            let yaml;
            
            // Handle packinfo specially
            if (this.state.currentFileType === 'packinfo') {
                const packinfo = this.state.currentFile.data || this.state.currentFile;
                yaml = `Name: ${packinfo.Name}\nVersion: ${packinfo.Version}\nAuthor: ${packinfo.Author}\nIcon:\n  Material: ${packinfo.Icon.Material}\n  Model: ${packinfo.Icon.Model}\nURL: ${packinfo.URL}\nDescription:\n${packinfo.Description.map(line => `- ${line}`).join('\n')}`;
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
                    { keys: ['Ctrl', 'Shift', 'P'], desc: 'Browse Templates' }
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
        this.showToast('Help documentation coming soon!', 'info');
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
            default:
                console.warn('Unknown tool:', tool);
        }
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
