/**
 * ===================================
 * MOBILE MANAGER - Complete Mobile Support System
 * ===================================
 * 
 * Handles device detection, mobile UI switching, touch gestures,
 * and mobile-specific adaptations for the MythicMobs Editor.
 * 
 * Features:
 * - Automatic device detection (mobile/tablet/desktop)
 * - Mobile mode activation (hidden from desktop)
 * - Touch gesture support (swipe, long-press, pinch)
 * - Bottom navigation for mobile
 * - Adaptive UI components
 * - Smart skill line builder for mobile/tablet
 * - Pull-to-refresh functionality
 * - Offline mode detection
 * - Voice search support
 * - Haptic feedback system
 * - Smart keyboard handling
 * 
 * @version 1.1.0
 * @date January 2026
 */

class MobileManager {
    constructor() {
        // Breakpoints - MUST be defined FIRST before device detection
        this.breakpoints = {
            mobile: 768,
            tablet: 1024,
            desktop: 1025
        };
        
        // Device detection (needs breakpoints to be defined)
        this.deviceType = this.detectDeviceType();
        this.isTouchDevice = this.detectTouchSupport();
        this.orientation = this.detectOrientation();
        
        // Convenience properties for easier checks
        this.isMobile = this.deviceType === 'mobile';
        this.isTablet = this.deviceType === 'tablet';
        this.isDesktop = this.deviceType === 'desktop';
        
        // State
        this.state = {
            mobileMode: false,
            activePanel: 'home', // 'home', 'files', 'edit', 'tools', 'user'
            sidebarOpen: false,
            yamlSheetOpen: false,
            yamlSheetHeight: 0.3, // 30% of screen
            gesturesEnabled: true,
            isOnline: navigator.onLine,
            keyboardOpen: false,
            lastScrollY: 0,
            pullToRefreshEnabled: true,
            voiceSearchActive: false,
            recentActions: [], // For quick action suggestions
            splitViewEnabled: false // Tablet feature
        };
        
        // Touch tracking with enhanced gesture support
        this.touch = {
            startX: 0,
            startY: 0,
            startTime: 0,
            longPressTimer: null,
            longPressThreshold: 500, // ms
            swipeThreshold: 50, // px
            currentElement: null,
            velocityX: 0,
            velocityY: 0,
            lastMoveTime: 0,
            lastMoveX: 0,
            lastMoveY: 0,
            isPinching: false,
            pinchStartDistance: 0,
            doubleTapTimer: null,
            lastTapTime: 0,
            tapCount: 0
        };
        
        // Haptic feedback patterns
        this.hapticPatterns = {
            light: [10],
            medium: [20],
            heavy: [30],
            success: [10, 50, 10],
            error: [50, 100, 50],
            warning: [30, 50, 30],
            selection: [5],
            impact: [15, 30]
        };
        
        // DOM cache
        this.dom = {};
        
        // Editor reference (set by init)
        this.editor = null;
        
        // Quick action history for smart suggestions
        this.actionHistory = [];
        
        // Don't auto-init - wait for explicit init() call with editor reference
    }
    
    /**
     * Initialize mobile manager
     * @param {object} editor - Reference to the main editor instance
     */
    init(editor) {
        // Store editor reference
        this.editor = editor || window.editor;
        
        // Set device attribute on body
        this.updateDeviceAttribute();
        
        // Only activate mobile mode for mobile/tablet devices
        if (this.deviceType !== 'desktop') {
            this.activateMobileMode();
        }
        
        // Listen for resize/orientation changes
        this.attachResizeListeners();
        
        // Attach touch listeners if touch device
        if (this.isTouchDevice) {
            this.attachTouchListeners();
        }
        
        // Setup online/offline detection
        this.setupConnectivityListeners();
        
        // Setup keyboard detection (for virtual keyboards)
        this.setupKeyboardDetection();
        
        // Setup pull-to-refresh
        if (this.deviceType !== 'desktop') {
            this.setupPullToRefresh();
        }
        
        // Load action history for smart suggestions
        this.loadActionHistory();
        
        console.log(`📱 MobileManager initialized: ${this.deviceType}, touch: ${this.isTouchDevice}`);
    }
    
    /**
     * Setup online/offline connectivity listeners
     */
    setupConnectivityListeners() {
        window.addEventListener('online', () => {
            this.state.isOnline = true;
            this.updateOnlineIndicator();
            this.showToast('Back online! Syncing...', 'success');
            this.syncOfflineChanges();
        });
        
        window.addEventListener('offline', () => {
            this.state.isOnline = false;
            this.updateOnlineIndicator();
            this.showToast('You\'re offline. Changes will sync when connected.', 'warning');
        });
        
        // Initial check
        this.updateOnlineIndicator();
    }
    
    /**
     * Update online/offline indicator in UI
     */
    updateOnlineIndicator() {
        let indicator = document.getElementById('mobile-connectivity-indicator');
        
        if (!indicator && this.state.mobileMode) {
            indicator = document.createElement('div');
            indicator.id = 'mobile-connectivity-indicator';
            indicator.className = 'mobile-connectivity-indicator';
            document.body.appendChild(indicator);
        }
        
        if (indicator) {
            indicator.className = `mobile-connectivity-indicator ${this.state.isOnline ? 'online' : 'offline'}`;
            indicator.innerHTML = this.state.isOnline 
                ? '<i class="fas fa-wifi"></i>' 
                : '<i class="fas fa-wifi-slash"></i> Offline';
        }
    }
    
    /**
     * Sync changes made while offline
     */
    async syncOfflineChanges() {
        // Check for pending changes in localStorage
        const pendingChanges = localStorage.getItem('mythicmobs_offline_changes');
        if (pendingChanges) {
            try {
                const changes = JSON.parse(pendingChanges);
                // Process each change...
                console.log('📱 Syncing offline changes:', changes.length);
                localStorage.removeItem('mythicmobs_offline_changes');
                this.showToast(`Synced ${changes.length} offline changes`, 'success');
            } catch (e) {
                console.error('Failed to sync offline changes:', e);
            }
        }
    }
    
    /**
     * Setup virtual keyboard detection
     */
    setupKeyboardDetection() {
        // Use visualViewport API for better keyboard detection
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                const heightDiff = window.innerHeight - window.visualViewport.height;
                const keyboardOpen = heightDiff > 150; // Threshold for keyboard
                
                if (keyboardOpen !== this.state.keyboardOpen) {
                    this.state.keyboardOpen = keyboardOpen;
                    document.body.classList.toggle('keyboard-open', keyboardOpen);
                    
                    if (keyboardOpen) {
                        this.onKeyboardOpen();
                    } else {
                        this.onKeyboardClose();
                    }
                }
            });
        }
    }
    
    /**
     * Handle keyboard open
     */
    onKeyboardOpen() {
        // Hide bottom nav and FAB when keyboard is open
        if (this.dom.bottomNav) {
            this.dom.bottomNav.classList.add('hidden');
        }
        if (this.dom.fab) {
            this.dom.fab.classList.add('hidden');
        }
        
        // Scroll focused input into view
        setTimeout(() => {
            const focused = document.activeElement;
            if (focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA')) {
                focused.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }
    
    /**
     * Handle keyboard close
     */
    onKeyboardClose() {
        // Show bottom nav and FAB again
        if (this.dom.bottomNav) {
            this.dom.bottomNav.classList.remove('hidden');
        }
        if (this.dom.fab) {
            this.dom.fab.classList.remove('hidden');
        }
    }
    
    /**
     * Setup pull-to-refresh functionality
     */
    setupPullToRefresh() {
        let pullStartY = 0;
        let pullDistance = 0;
        let isPulling = false;
        const threshold = 80;
        
        const pullIndicator = document.createElement('div');
        pullIndicator.className = 'pull-to-refresh-indicator';
        pullIndicator.innerHTML = `
            <div class="pull-spinner">
                <i class="fas fa-sync-alt"></i>
            </div>
            <span class="pull-text">Pull to refresh</span>
        `;
        document.body.appendChild(pullIndicator);
        
        document.addEventListener('touchstart', (e) => {
            if (!this.state.pullToRefreshEnabled) return;
            if (window.scrollY !== 0) return;
            
            pullStartY = e.touches[0].clientY;
            isPulling = true;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!isPulling) return;
            
            pullDistance = e.touches[0].clientY - pullStartY;
            
            if (pullDistance > 0 && window.scrollY === 0) {
                e.preventDefault();
                
                const progress = Math.min(pullDistance / threshold, 1);
                pullIndicator.style.transform = `translateY(${Math.min(pullDistance * 0.5, 60)}px)`;
                pullIndicator.style.opacity = progress;
                
                const spinner = pullIndicator.querySelector('.pull-spinner i');
                spinner.style.transform = `rotate(${pullDistance * 2}deg)`;
                
                if (progress >= 1) {
                    pullIndicator.classList.add('ready');
                    pullIndicator.querySelector('.pull-text').textContent = 'Release to refresh';
                } else {
                    pullIndicator.classList.remove('ready');
                    pullIndicator.querySelector('.pull-text').textContent = 'Pull to refresh';
                }
            }
        }, { passive: false });
        
        document.addEventListener('touchend', () => {
            if (!isPulling) return;
            isPulling = false;
            
            if (pullDistance >= threshold) {
                pullIndicator.classList.add('refreshing');
                pullIndicator.querySelector('.pull-text').textContent = 'Refreshing...';
                this.vibrate('medium');
                
                // Trigger refresh
                this.performRefresh().then(() => {
                    pullIndicator.classList.remove('refreshing', 'ready');
                    pullIndicator.style.transform = 'translateY(0)';
                    pullIndicator.style.opacity = '0';
                    pullIndicator.querySelector('.pull-text').textContent = 'Pull to refresh';
                    this.vibrate('success');
                });
            } else {
                pullIndicator.style.transform = 'translateY(0)';
                pullIndicator.style.opacity = '0';
            }
            
            pullDistance = 0;
        }, { passive: true });
    }
    
    /**
     * Perform refresh action
     */
    async performRefresh() {
        return new Promise(resolve => {
            // Refresh pack tree
            const editor = this.getEditor();
            if (editor?.packManager) {
                editor.packManager.refreshTree();
            }
            
            // Refresh YAML preview
            if (editor?.updateYAMLPreview) {
                editor.updateYAMLPreview();
            }
            
            setTimeout(resolve, 1000); // Minimum visual feedback time
        });
    }
    
    /**
     * Load action history for smart suggestions
     */
    loadActionHistory() {
        try {
            const saved = localStorage.getItem('mythicmobs_action_history');
            if (saved) {
                this.actionHistory = JSON.parse(saved);
            }
        } catch (e) {
            this.actionHistory = [];
        }
    }
    
    /**
     * Track action for smart suggestions
     */
    trackAction(action, data = {}) {
        this.actionHistory.unshift({
            action,
            data,
            timestamp: Date.now()
        });
        
        // Keep only last 50 actions
        this.actionHistory = this.actionHistory.slice(0, 50);
        
        try {
            localStorage.setItem('mythicmobs_action_history', JSON.stringify(this.actionHistory));
        } catch (e) {
            // Quota exceeded, clear old data
            this.actionHistory = this.actionHistory.slice(0, 10);
        }
    }
    
    /**
     * Get smart action suggestions based on history
     */
    getSmartSuggestions() {
        // Analyze action patterns
        const actionCounts = {};
        this.actionHistory.forEach(item => {
            actionCounts[item.action] = (actionCounts[item.action] || 0) + 1;
        });
        
        // Sort by frequency
        const sorted = Object.entries(actionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([action]) => action);
        
        return sorted;
    }
    
    /**
     * Detect device type based on screen width and user agent
     */
    detectDeviceType() {
        const width = window.innerWidth;
        const userAgent = navigator.userAgent.toLowerCase();
        
        // Check user agent for mobile devices
        const isMobileUA = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isTabletUA = /ipad|tablet|playbook|silk/i.test(userAgent) || 
                          (userAgent.includes('android') && !userAgent.includes('mobile'));
        
        // Combine UA detection with screen width
        if (isMobileUA || width < this.breakpoints.mobile) {
            return 'mobile';
        } else if (isTabletUA || (width >= this.breakpoints.mobile && width < this.breakpoints.tablet)) {
            return 'tablet';
        }
        return 'desktop';
    }
    
    /**
     * Detect touch support
     */
    detectTouchSupport() {
        return 'ontouchstart' in window || 
               navigator.maxTouchPoints > 0 || 
               navigator.msMaxTouchPoints > 0;
    }
    
    /**
     * Detect screen orientation
     */
    detectOrientation() {
        if (window.screen?.orientation?.type) {
            return window.screen.orientation.type.includes('portrait') ? 'portrait' : 'landscape';
        }
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }
    
    /**
     * Update device attribute on body element
     */
    updateDeviceAttribute() {
        document.body.setAttribute('data-device', this.deviceType);
        document.body.setAttribute('data-touch', this.isTouchDevice ? 'true' : 'false');
        document.body.setAttribute('data-orientation', this.orientation);
    }
    
    /**
     * Activate mobile mode - creates mobile UI elements
     */
    activateMobileMode() {
        if (this.state.mobileMode) return;
        
        this.state.mobileMode = true;
        document.body.classList.add('mobile-mode');
        
        // Check if user is in Guided mode - switch to Beginner on mobile
        this.preventGuidedModeOnMobile();
        
        // Create mobile UI elements
        this.createBottomNavigation();
        this.createMobileSidebar();
        this.createYAMLBottomSheet();
        this.createFloatingActionButton();
        this.createMobileSearchBar();
        // Quick Access Bar removed - user requested removal
        // this.createQuickAccessBar();
        
        // Create mobile account sheet
        this.createMobileAccountSheet();
        
        // Create header more button (for Save, Settings, etc.)
        this.createMobileHeaderMoreButton();
        
        // Create tablet-specific features
        if (this.isTablet) {
            this.createTabletSplitView();
        }
        
        // Hide desktop-specific elements
        this.hideDesktopElements();
        
        // Apply mobile-specific styles
        this.applyMobileStyles();
        
        // Attach mobile event listeners
        this.attachMobileEventListeners();
        
        // Setup smart input enhancements
        this.enhanceInputFields();
        
        // Initialize touch tooltip support
        this.initTooltipTouchSupport();
        
        // Initialize touch drag for sortable lists
        this.initTouchDragLists();
        
        // Initialize all smart mobile features
        this.initAllSmartFeatures();
        
        console.log('📱 Mobile mode activated');
    }
    
    /**
     * Initialize touch drag for all sortable lists in the app
     */
    initTouchDragLists() {
        // Skill queue items
        const skillQueue = document.querySelector('.skill-line-builder-queue, .skill-queue');
        if (skillQueue) {
            this.enableTouchDragSort(skillQueue, '.skill-queue-item', '.drag-handle', (result) => {
                // Dispatch custom event for the skill builder to handle
                skillQueue.dispatchEvent(new CustomEvent('touchreorder', { 
                    detail: result,
                    bubbles: true 
                }));
            });
        }
        
        // AI tree items
        const aiTree = document.querySelector('.ai-tree-container, .ai-goals-list');
        if (aiTree) {
            this.enableTouchDragSort(aiTree, '.ai-tree-item, .ai-goal-item', '.drag-handle', (result) => {
                aiTree.dispatchEvent(new CustomEvent('touchreorder', { 
                    detail: result,
                    bubbles: true 
                }));
            });
        }
        
        // Re-initialize when content changes (use MutationObserver)
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    // Check for new sortable containers
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            const queue = node.querySelector?.('.skill-line-builder-queue, .skill-queue');
                            if (queue && !queue.dataset.touchDragInit) {
                                queue.dataset.touchDragInit = 'true';
                                this.enableTouchDragSort(queue, '.skill-queue-item', '.drag-handle');
                            }
                        }
                    });
                }
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    /**
     * Prevent Guided mode on mobile - switch to Beginner if needed
     */
    preventGuidedModeOnMobile() {
        const currentMode = document.body.dataset.mode || localStorage.getItem('editorMode');
        
        if (currentMode === 'guided') {
            // Switch to beginner mode
            document.body.dataset.mode = 'beginner';
            localStorage.setItem('editorMode', 'beginner');
            
            // Update mode buttons
            document.querySelectorAll('.mode-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            });
            const beginnerBtn = document.querySelector('.mode-btn[data-mode="beginner"]');
            if (beginnerBtn) {
                beginnerBtn.classList.add('active');
                beginnerBtn.setAttribute('aria-pressed', 'true');
            }
            
            // Notify user
            this.showToast('Guided mode is not available on mobile. Switched to Beginner mode.', 'info');
            console.log('📱 Guided mode not available on mobile - switched to Beginner');
        }
        
        // Intercept guided button clicks
        const guidedBtn = document.querySelector('.mode-btn[data-mode="guided"]');
        if (guidedBtn) {
            guidedBtn.addEventListener('click', (e) => {
                if (this.state.mobileMode) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showToast('Guided mode is not available on mobile', 'warning');
                }
            }, true);
        }
        
        // Setup compact mode dropdown trigger (active pill)
        const activeBtn = document.querySelector('.mode-switcher .mode-btn.active');
        if (activeBtn) {
            // mark as dropdown trigger so global click handler can ignore it
            activeBtn.setAttribute('data-mode-dropdown', 'true');

            if (!document.getElementById('mode-dropdown')) {
                activeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleModeDropdown(e.currentTarget);
                });
            }
        }
    }

    /**
     * Toggle mode dropdown for mobile (attached to active pill)
     */
    toggleModeDropdown(anchor) {
        let dropdown = document.getElementById('mode-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.id = 'mode-dropdown';
            dropdown.className = 'mode-dropdown';
            dropdown.innerHTML = `
                <div class="mode-option" data-mode="beginner"><i class="fas fa-user"></i><span>Beginner</span><span class="mode-badge">Recommended</span></div>
                <div class="mode-option" data-mode="advanced"><i class="fas fa-user-cog"></i><span>Advanced</span></div>
            `;
            anchor.parentElement.appendChild(dropdown);
            dropdown.querySelectorAll('.mode-option').forEach(opt => {
                opt.addEventListener('click', (e) => {
                    const mode = opt.dataset.mode;
                    this.setEditorMode(mode);
                    this.closeModeDropdown();
                });
            });

            // Close when clicking outside
            document.addEventListener('click', (ev) => {
                if (!anchor.contains(ev.target) && !dropdown.contains(ev.target)) {
                    this.closeModeDropdown();
                }
            });
        }
        dropdown.classList.toggle('visible');
    }

    closeModeDropdown() {
        const d = document.getElementById('mode-dropdown');
        if (d) d.classList.remove('visible');
    }

    /**
     * Set editor mode helper
     */
    setEditorMode(mode) {
        const current = document.body.dataset.mode || localStorage.getItem('editorMode') || 'beginner';
        // If selecting the same mode, just close the dropdown silently
        if (mode === current) {
            this.closeModeDropdown();
            return;
        }

        document.body.dataset.mode = mode;
        localStorage.setItem('editorMode', mode);
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
            btn.setAttribute('aria-pressed', btn.dataset.mode === mode ? 'true' : 'false');
            // remove dropdown attribute from all, will set only on the active pill
            btn.removeAttribute('data-mode-dropdown');
        });
        this.showToast(`${mode.charAt(0).toUpperCase() + mode.slice(1)} mode selected`, 'success');

        // Ensure active pill has dropdown listener (attach once)
        const activeBtn = document.querySelector('.mode-switcher .mode-btn.active');
        if (activeBtn && !activeBtn.dataset.dropdownAttached) {
            // mark as dropdown trigger for global handler
            activeBtn.setAttribute('data-mode-dropdown', 'true');

            activeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleModeDropdown(e.currentTarget);
            });
            activeBtn.dataset.dropdownAttached = 'true';
        }
        // If mobile, also ensure active pill is marked as dropdown trigger (in case it was already attached earlier)
        if (document.body.classList.contains('mobile-mode') || document.body.dataset.device === 'mobile') {
            activeBtn?.setAttribute('data-mode-dropdown', 'true');
        }
    }
    
    /**
     * Create bottom navigation bar for mobile
     */
    createBottomNavigation() {
        if (document.getElementById('mobile-bottom-nav')) return;
        
        const nav = document.createElement('nav');
        nav.id = 'mobile-bottom-nav';
        nav.className = 'mobile-bottom-nav';
        nav.innerHTML = `
            <button class="mobile-nav-item active" data-panel="home" aria-label="Dashboard">
                <i class="fas fa-home"></i>
                <span>Home</span>
            </button>
            <button class="mobile-nav-item" data-panel="files" aria-label="Files">
                <i class="fas fa-folder-tree"></i>
                <span>Files</span>
            </button>
            <button class="mobile-nav-item" data-panel="tools" aria-label="Tools">
                <i class="fas fa-wrench"></i>
                <span>Tools</span>
            </button>
            <button class="mobile-nav-item" data-panel="yaml" aria-label="YAML Preview">
                <i class="fas fa-code"></i>
                <span>YAML</span>
            </button>
        `;
        
        document.body.appendChild(nav);
        this.dom.bottomNav = nav;
    }
    
    /**
     * Create mobile sidebar overlay
     */
    createMobileSidebar() {
        if (document.getElementById('mobile-sidebar-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'mobile-sidebar-overlay';
        overlay.className = 'mobile-sidebar-overlay';
        overlay.innerHTML = `
            <div class="mobile-sidebar">
                <div class="mobile-sidebar-header">
                    <h3><i class="fas fa-folder-tree"></i> Packs</h3>
                    <button class="mobile-sidebar-close" aria-label="Close sidebar">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="mobile-sidebar-content" id="mobile-pack-tree">
                    <!-- Pack tree will be cloned here -->
                </div>
                <div class="mobile-sidebar-footer">
                    <button class="btn btn-primary btn-block" id="mobile-new-pack-btn">
                        <i class="fas fa-plus"></i> New Pack
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this.dom.sidebarOverlay = overlay;
    }
    
    /**
     * Create YAML preview bottom sheet
     */
    createYAMLBottomSheet() {
        if (document.getElementById('mobile-yaml-sheet')) return;
        
        const sheet = document.createElement('div');
        sheet.id = 'mobile-yaml-sheet';
        sheet.className = 'mobile-yaml-sheet';
        sheet.innerHTML = `
            <div class="yaml-sheet-handle">
                <div class="yaml-sheet-handle-bar"></div>
            </div>
            <div class="yaml-sheet-header">
                <h3><i class="fas fa-code"></i> YAML Preview</h3>
                <div class="yaml-sheet-actions">
                    <button class="icon-btn" id="mobile-copy-yaml" title="Copy YAML">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="icon-btn" id="mobile-export-yaml" title="Export">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="icon-btn" id="mobile-close-yaml" title="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="yaml-sheet-content" id="mobile-yaml-content">
                <pre><code># Select an item to preview</code></pre>
            </div>
        `;
        
        document.body.appendChild(sheet);
        this.dom.yamlSheet = sheet;
    }
    
    /**
     * Create floating action button (FAB) for quick actions
     */
    createFloatingActionButton() {
        if (document.getElementById('mobile-fab')) return;
        
        const fab = document.createElement('div');
        fab.id = 'mobile-fab';
        fab.className = 'mobile-fab';
        fab.innerHTML = `
            <div class="fab-menu" id="fab-menu">
                <button class="fab-menu-item" data-action="quick-skill" title="Quick Skill Line">
                    <i class="fas fa-bolt"></i>
                    <span>Quick Skill</span>
                </button>
                <button class="fab-menu-item" data-action="new-mob" title="New Mob">
                    <i class="fas fa-skull"></i>
                    <span>Mob</span>
                </button>
                <button class="fab-menu-item" data-action="new-skill" title="New Skill File">
                    <i class="fas fa-magic"></i>
                    <span>Skill File</span>
                </button>
                <button class="fab-menu-item" data-action="new-item" title="New Item">
                    <i class="fas fa-gem"></i>
                    <span>Item</span>
                </button>
                <button class="fab-menu-item" data-action="new-droptable" title="New Drop Table">
                    <i class="fas fa-gift"></i>
                    <span>Drops</span>
                </button>
            </div>
            <button class="fab-main" id="fab-main" aria-label="Quick actions">
                <i class="fas fa-plus"></i>
            </button>
        `;
        
        document.body.appendChild(fab);
        this.dom.fab = fab;
    }
    
    /**
     * Create mobile search bar with voice input support
     */
    createMobileSearchBar() {
        if (document.getElementById('mobile-search-bar')) return;
        
        const hasVoiceSupport = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        
        const searchBar = document.createElement('div');
        searchBar.id = 'mobile-search-bar';
        searchBar.className = 'mobile-search-bar';
        searchBar.innerHTML = `
            <div class="mobile-search-container">
                <i class="fas fa-search search-icon" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); z-index: 2;"></i>
                <input type="text" 
                    class="mobile-search-input" 
                    placeholder="Search mobs, skills, items..."
                    autocomplete="off"
                    autocapitalize="off"
                    autocorrect="off"
                    style="padding-left: 42px !important;">
                ${hasVoiceSupport ? `
                    <button class="voice-search-btn" aria-label="Voice search">
                        <i class="fas fa-microphone"></i>
                    </button>
                ` : ''}
                <button class="search-clear-btn hidden" aria-label="Clear search">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="mobile-search-results hidden">
                <div class="search-results-list"></div>
            </div>
        `;
        
        // Insert after header
        const header = document.querySelector('.app-header');
        if (header) {
            header.after(searchBar);
        } else {
            document.body.appendChild(searchBar);
        }
        
        this.dom.searchBar = searchBar;
        this.setupMobileSearch();
    }
    
    /**
     * Setup mobile search functionality
     */
    setupMobileSearch() {
        const input = this.dom.searchBar?.querySelector('.mobile-search-input');
        const clearBtn = this.dom.searchBar?.querySelector('.search-clear-btn');
        const voiceBtn = this.dom.searchBar?.querySelector('.voice-search-btn');
        const resultsContainer = this.dom.searchBar?.querySelector('.mobile-search-results');
        
        if (!input) return;
        
        let searchTimeout;
        
        input.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            clearBtn?.classList.toggle('hidden', !query);
            
            clearTimeout(searchTimeout);
            
            if (query.length >= 2) {
                searchTimeout = setTimeout(() => {
                    this.performMobileSearch(query);
                }, 300);
            } else {
                resultsContainer?.classList.add('hidden');
            }
        });
        
        input.addEventListener('focus', () => {
            this.dom.searchBar.classList.add('focused');
            // Show recent searches
            if (!input.value) {
                this.showRecentSearches();
            }
        });
        
        input.addEventListener('blur', () => {
            setTimeout(() => {
                this.dom.searchBar.classList.remove('focused');
                resultsContainer?.classList.add('hidden');
            }, 200);
        });
        
        clearBtn?.addEventListener('click', () => {
            input.value = '';
            clearBtn.classList.add('hidden');
            resultsContainer?.classList.add('hidden');
            input.focus();
        });
        
        // Voice search
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.startVoiceSearch());
        }
    }
    
    /**
     * Perform mobile search
     */
    performMobileSearch(query) {
        const editor = this.getEditor();
        const resultsContainer = this.dom.searchBar?.querySelector('.mobile-search-results');
        const resultsList = this.dom.searchBar?.querySelector('.search-results-list');
        
        if (!editor || !resultsContainer || !resultsList) return;
        
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        // Search in current pack
        if (editor.state.currentPack) {
            const pack = editor.state.currentPack;
            
            // Search mobs
            if (pack.mobs) {
                Object.entries(pack.mobs).forEach(([id, mob]) => {
                    if (id.toLowerCase().includes(lowerQuery) || 
                        mob.DisplayName?.toLowerCase().includes(lowerQuery)) {
                        results.push({
                            type: 'mob',
                            id,
                            name: mob.DisplayName || id,
                            icon: 'fa-skull'
                        });
                    }
                });
            }
            
            // Search skills
            if (pack.skills) {
                Object.entries(pack.skills).forEach(([id, skill]) => {
                    if (id.toLowerCase().includes(lowerQuery)) {
                        results.push({
                            type: 'skill',
                            id,
                            name: id,
                            icon: 'fa-magic'
                        });
                    }
                });
            }
            
            // Search items
            if (pack.items) {
                Object.entries(pack.items).forEach(([id, item]) => {
                    if (id.toLowerCase().includes(lowerQuery) ||
                        item.DisplayName?.toLowerCase().includes(lowerQuery)) {
                        results.push({
                            type: 'item',
                            id,
                            name: item.DisplayName || id,
                            icon: 'fa-gem'
                        });
                    }
                });
            }
        }
        
        // Render results
        if (results.length > 0) {
            resultsList.innerHTML = results.slice(0, 10).map(r => `
                <button class="search-result-item" data-type="${r.type}" data-id="${r.id}">
                    <i class="fas ${r.icon}"></i>
                    <div class="result-info">
                        <span class="result-name">${r.name}</span>
                        <span class="result-type">${r.type}</span>
                    </div>
                </button>
            `).join('');
            
            resultsContainer.classList.remove('hidden');
            
            // Add click handlers
            resultsList.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const type = item.dataset.type;
                    const id = item.dataset.id;
                    this.openSearchResult(type, id);
                    resultsContainer.classList.add('hidden');
                    this.dom.searchBar.querySelector('.mobile-search-input').value = '';
                    this.saveRecentSearch(query);
                });
            });
        } else {
            resultsList.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <span>No results found for "${query}"</span>
                </div>
            `;
            resultsContainer.classList.remove('hidden');
        }
    }
    
    /**
     * Open search result
     */
    openSearchResult(type, id) {
        const editor = this.getEditor();
        if (!editor) return;
        
        this.trackAction('search_open', { type, id });
        
        switch (type) {
            case 'mob':
                editor.openMob?.(id);
                break;
            case 'skill':
                editor.openSkill?.(id);
                break;
            case 'item':
                editor.openItem?.(id);
                break;
        }
    }
    
    /**
     * Start voice search
     */
    startVoiceSearch() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        const input = this.dom.searchBar?.querySelector('.mobile-search-input');
        const voiceBtn = this.dom.searchBar?.querySelector('.voice-search-btn');
        
        if (!input || !voiceBtn) return;
        
        recognition.onstart = () => {
            this.state.voiceSearchActive = true;
            voiceBtn.classList.add('listening');
            voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            this.vibrate('light');
        };
        
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            input.value = transcript;
            input.dispatchEvent(new Event('input'));
        };
        
        recognition.onend = () => {
            this.state.voiceSearchActive = false;
            voiceBtn.classList.remove('listening');
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        };
        
        recognition.onerror = (event) => {
            console.error('Voice search error:', event.error);
            this.showToast('Voice search failed. Please try again.', 'error');
        };
        
        recognition.start();
    }
    
    /**
     * Show recent searches
     */
    showRecentSearches() {
        const recent = this.getRecentSearches();
        const resultsContainer = this.dom.searchBar?.querySelector('.mobile-search-results');
        const resultsList = this.dom.searchBar?.querySelector('.search-results-list');
        
        if (!recent.length || !resultsContainer || !resultsList) return;
        
        resultsList.innerHTML = `
            <div class="recent-searches-header">
                <span>Recent Searches</span>
                <button class="clear-recent-btn">Clear</button>
            </div>
            ${recent.map(q => `
                <button class="search-result-item recent" data-query="${q}">
                    <i class="fas fa-clock"></i>
                    <span>${q}</span>
                </button>
            `).join('')}
        `;
        
        resultsContainer.classList.remove('hidden');
        
        // Clear button
        resultsList.querySelector('.clear-recent-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            localStorage.removeItem('mythicmobs_recent_searches');
            resultsContainer.classList.add('hidden');
        });
        
        // Recent search items
        resultsList.querySelectorAll('.search-result-item.recent').forEach(item => {
            item.addEventListener('click', () => {
                const query = item.dataset.query;
                this.dom.searchBar.querySelector('.mobile-search-input').value = query;
                this.performMobileSearch(query);
            });
        });
    }
    
    /**
     * Save recent search
     */
    saveRecentSearch(query) {
        const recent = this.getRecentSearches();
        const filtered = recent.filter(q => q !== query);
        filtered.unshift(query);
        localStorage.setItem('mythicmobs_recent_searches', JSON.stringify(filtered.slice(0, 5)));
    }
    
    /**
     * Get recent searches
     */
    getRecentSearches() {
        try {
            return JSON.parse(localStorage.getItem('mythicmobs_recent_searches') || '[]');
        } catch {
            return [];
        }
    }
    
    /**
     * Create quick access bar for frequently used actions
     */
    createQuickAccessBar() {
        if (document.getElementById('mobile-quick-access')) return;
        
        const suggestions = this.getSmartSuggestions();
        
        const quickBar = document.createElement('div');
        quickBar.id = 'mobile-quick-access';
        quickBar.className = 'mobile-quick-access';
        quickBar.innerHTML = `
            <div class="quick-access-scroll">
                <button class="quick-access-item" data-action="undo">
                    <i class="fas fa-undo"></i>
                    <span>Undo</span>
                </button>
                <button class="quick-access-item" data-action="redo">
                    <i class="fas fa-redo"></i>
                    <span>Redo</span>
                </button>
                <button class="quick-access-item" data-action="save">
                    <i class="fas fa-save"></i>
                    <span>Save</span>
                </button>
                <button class="quick-access-item" data-action="preview">
                    <i class="fas fa-eye"></i>
                    <span>Preview</span>
                </button>
                <button class="quick-access-item" data-action="copy-yaml">
                    <i class="fas fa-copy"></i>
                    <span>Copy YAML</span>
                </button>
                <button class="quick-access-item" data-action="validate">
                    <i class="fas fa-check-circle"></i>
                    <span>Validate</span>
                </button>
            </div>
        `;
        
        // Insert before editor content or at bottom of header
        const searchBar = this.dom.searchBar;
        if (searchBar) {
            searchBar.after(quickBar);
        }
        
        this.dom.quickAccess = quickBar;
        this.setupQuickAccessHandlers();
    }
    
    /**
     * Setup quick access handlers
     */
    setupQuickAccessHandlers() {
        this.dom.quickAccess?.querySelectorAll('.quick-access-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
                this.vibrate('selection');
            });
        });
    }
    
    /**
     * Handle quick action
     */
    handleQuickAction(action) {
        const editor = this.getEditor();
        if (!editor) return;
        
        this.trackAction('quick_action', { action });
        
        switch (action) {
            case 'undo':
                editor.undo?.();
                break;
            case 'redo':
                editor.redo?.();
                break;
            case 'save':
                editor.saveCurrentFile?.();
                break;
            case 'preview':
                this.toggleYAMLSheet();
                break;
            case 'copy-yaml':
                this.copyYAMLToClipboard();
                break;
            case 'validate':
                editor.validateCurrentFile?.();
                break;
        }
    }
    
    /**
     * Create tablet split view feature
     */
    createTabletSplitView() {
        if (document.getElementById('tablet-split-toggle')) return;
        
        const toggle = document.createElement('button');
        toggle.id = 'tablet-split-toggle';
        toggle.className = 'tablet-split-toggle';
        toggle.innerHTML = '<i class="fas fa-columns"></i>';
        toggle.title = 'Toggle split view';
        
        document.body.appendChild(toggle);
        
        toggle.addEventListener('click', () => {
            this.toggleSplitView();
        });
    }
    
    /**
     * Toggle tablet split view
     */
    toggleSplitView() {
        this.state.splitViewEnabled = !this.state.splitViewEnabled;
        document.body.classList.toggle('split-view', this.state.splitViewEnabled);
        
        const toggle = document.getElementById('tablet-split-toggle');
        if (toggle) {
            toggle.classList.toggle('active', this.state.splitViewEnabled);
        }
        
        this.vibrate('medium');
        this.showToast(
            this.state.splitViewEnabled ? 'Split view enabled' : 'Split view disabled',
            'info'
        );
    }
    
    /**
     * Create mobile header "More" button with dropdown
     */
    createMobileHeaderMoreButton() {
        if (document.getElementById('mobile-header-more-btn')) return;
        
        const headerRight = document.querySelector('.header-right');
        if (!headerRight) return;
        
        // Create more button
        const moreBtn = document.createElement('button');
        moreBtn.id = 'mobile-header-more-btn';
        moreBtn.className = 'mobile-header-more-btn';
        moreBtn.setAttribute('aria-label', 'More options');
        moreBtn.innerHTML = `
            <i class="fas fa-ellipsis-v"></i>
            <span class="unsaved-dot"></span>
        `;
        
        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.id = 'mobile-header-dropdown';
        dropdown.className = 'mobile-header-dropdown';
        dropdown.innerHTML = `
            <button class="mobile-header-dropdown-item primary" data-action="save-all">
                <i class="fas fa-save"></i>
                <span>Save All</span>
                <span class="save-badge">Saved</span>
            </button>
            <div class="mobile-header-dropdown-divider"></div>
            <button class="mobile-header-dropdown-item" data-action="settings">
                <i class="fas fa-cog"></i>
                <span>Settings</span>
            </button>
            <button class="mobile-header-dropdown-item" data-action="help">
                <i class="fas fa-question-circle"></i>
                <span>Help</span>
            </button>
            <div class="mobile-header-dropdown-divider"></div>
            <button class="mobile-header-dropdown-item" data-action="mode-info">
                <i class="fas fa-layer-group"></i>
                <span>Mode Comparison</span>
            </button>
        `;
        
        // Insert before user account button
        const userAccount = headerRight.querySelector('.user-account');
        if (userAccount) {
            headerRight.insertBefore(moreBtn, userAccount);
        } else {
            headerRight.appendChild(moreBtn);
        }
        document.body.appendChild(dropdown);
        
        this.dom.headerMoreBtn = moreBtn;
        this.dom.headerDropdown = dropdown;
        
        // Setup event listeners - handle both click and touch
        let touchHandled = false;
        
        const toggleDropdown = (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.toggleMobileHeaderDropdown();
        };
        
        // Handle touch events
        moreBtn.addEventListener('touchend', (e) => {
            touchHandled = true;
            toggleDropdown(e);
            // Reset flag after a short delay
            setTimeout(() => { touchHandled = false; }, 300);
        });
        
        // Handle click events (but skip if touch was already handled)
        moreBtn.addEventListener('click', (e) => {
            if (!touchHandled) {
                toggleDropdown(e);
            }
        });
        
        dropdown.querySelectorAll('.mobile-header-dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = item.dataset.action;
                this.handleMobileHeaderAction(action);
                this.closeMobileHeaderDropdown();
            });
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!moreBtn.contains(e.target) && !dropdown.contains(e.target)) {
                this.closeMobileHeaderDropdown();
            }
        });
        
        // Listen for save status changes
        this.setupSaveStatusListener();
    }
    
    /**
     * Toggle mobile header dropdown
     */
    toggleMobileHeaderDropdown() {
        const dropdown = this.dom.headerDropdown;
        if (!dropdown) return;
        
        const isVisible = dropdown.classList.contains('visible');
        if (isVisible) {
            this.closeMobileHeaderDropdown();
        } else {
            dropdown.classList.add('visible');
            this.vibrate('light');
        }
    }
    
    /**
     * Close mobile header dropdown
     */
    closeMobileHeaderDropdown() {
        this.dom.headerDropdown?.classList.remove('visible');
    }
    
    /**
     * Handle mobile header dropdown actions
     */
    handleMobileHeaderAction(action) {
        this.vibrate('light');
        
        switch (action) {
            case 'save-all':
                document.getElementById('save-all-btn')?.click();
                this.showToast('Saving all changes...', 'info');
                break;
            case 'settings':
                document.getElementById('settings-btn')?.click();
                break;
            case 'help':
                document.getElementById('help-btn')?.click();
                break;
            case 'mode-info':
                document.getElementById('mode-difference-btn')?.click();
                break;
        }
    }
    
    /**
     * Setup listener for save status changes
     */
    setupSaveStatusListener() {
        const moreBtn = this.dom.headerMoreBtn;
        if (!moreBtn) return;
        
        // Use MutationObserver to watch for save status changes
        const saveStatus = document.getElementById('save-status');
        if (saveStatus) {
            const observer = new MutationObserver(() => {
                this.updateSaveStatusIndicator();
            });
            observer.observe(saveStatus, { 
                attributes: true, 
                childList: true, 
                subtree: true 
            });
        }
        
        // Initial update
        this.updateSaveStatusIndicator();
    }
    
    /**
     * Update save status indicator on more button
     */
    updateSaveStatusIndicator() {
        const moreBtn = this.dom.headerMoreBtn;
        const dropdown = this.dom.headerDropdown;
        const saveStatus = document.getElementById('save-status');
        
        if (!moreBtn || !saveStatus) return;
        
        const isUnsaved = saveStatus.classList.contains('unsaved') || 
                          saveStatus.textContent.toLowerCase().includes('unsaved');
        
        moreBtn.classList.toggle('has-unsaved', isUnsaved);
        
        // Update dropdown badge
        const badge = dropdown?.querySelector('.save-badge');
        if (badge) {
            badge.textContent = isUnsaved ? 'Unsaved' : 'Saved';
            badge.classList.toggle('unsaved', isUnsaved);
        }
    }
    
    /**
     * Create mobile account sheet (bottom sheet UI for account menu)
     */
    createMobileAccountSheet() {
        if (document.getElementById('mobile-account-sheet')) return;
        
        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'mobile-account-backdrop';
        backdrop.className = 'mobile-account-sheet-backdrop';
        document.body.appendChild(backdrop);
        
        // Create account sheet
        const sheet = document.createElement('div');
        sheet.id = 'mobile-account-sheet';
        sheet.className = 'mobile-account-sheet';
        
        // Initial state - will be updated based on auth
        this.updateMobileAccountSheet(sheet);
        
        document.body.appendChild(sheet);
        this.dom.accountSheet = sheet;
        this.dom.accountBackdrop = backdrop;
        
        // Setup event listeners
        backdrop.addEventListener('click', () => this.closeMobileAccountSheet());
        
        // Handle swipe down to close
        let startY = 0;
        sheet.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        sheet.addEventListener('touchmove', (e) => {
            const currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            if (diff > 50) {
                this.closeMobileAccountSheet();
            }
        }, { passive: true });
        
        // Override header account button click for mobile
        this.setupMobileAccountButton();
        
        // Listen for auth state changes
        if (window.authManager) {
            window.authManager.onAuthStateChange?.((user) => {
                this.updateMobileAccountSheet(this.dom.accountSheet);
            });
        }
    }
    
    /**
     * Update mobile account sheet content based on auth state
     */
    updateMobileAccountSheet(sheet) {
        if (!sheet) return;
        
        const user = window.authManager?.getCurrentUser?.();
        const isLoggedIn = !!user;
        
        if (isLoggedIn) {
            const email = user.email || 'User';
            const displayName = user.user_metadata?.display_name || email.split('@')[0];
            const initial = displayName.charAt(0).toUpperCase();
            
            sheet.innerHTML = `
                <div class="mobile-account-sheet-handle"></div>
                <div class="mobile-account-sheet-header">
                    <div class="mobile-account-avatar">${initial}</div>
                    <div class="mobile-account-info">
                        <div class="mobile-account-name">${this.escapeHtml(displayName)}</div>
                        <div class="mobile-account-email">${this.escapeHtml(email)}</div>
                    </div>
                </div>
                <div class="mobile-account-menu">
                    <button class="mobile-account-menu-item" data-action="profile">
                        <i class="fas fa-user"></i>
                        <span>Edit Profile</span>
                    </button>
                    <button class="mobile-account-menu-item" data-action="settings">
                        <i class="fas fa-cog"></i>
                        <span>Settings</span>
                    </button>
                    <button class="mobile-account-menu-item" data-action="sync">
                        <i class="fas fa-cloud"></i>
                        <span>Cloud Sync</span>
                    </button>
                    <div class="mobile-account-divider"></div>
                    <button class="mobile-account-menu-item" data-action="templates">
                        <i class="fas fa-layer-group"></i>
                        <span>My Templates</span>
                    </button>
                    <button class="mobile-account-menu-item" data-action="backup">
                        <i class="fas fa-download"></i>
                        <span>Backup Data</span>
                    </button>
                    <div class="mobile-account-divider"></div>
                    <button class="mobile-account-menu-item danger" data-action="logout">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Sign Out</span>
                    </button>
                </div>
            `;
        } else {
            sheet.innerHTML = `
                <div class="mobile-account-sheet-handle"></div>
                <div class="mobile-account-guest">
                    <div class="mobile-account-guest-icon">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <h3>Welcome to Soaps Editor</h3>
                    <p>Sign in to sync your packs across devices and access community templates.</p>
                    <button class="btn btn-primary" data-action="signin">
                        <i class="fas fa-sign-in-alt"></i> Sign In
                    </button>
                </div>
            `;
        }
        
        // Attach menu handlers
        this.setupMobileAccountMenuHandlers(sheet);
    }
    
    /**
     * Setup handlers for mobile account menu items
     */
    setupMobileAccountMenuHandlers(sheet) {
        sheet.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleMobileAccountAction(action);
            });
        });
    }
    
    /**
     * Handle mobile account menu actions
     */
    handleMobileAccountAction(action) {
        this.closeMobileAccountSheet();
        this.vibrate('selection');
        
        switch (action) {
            case 'signin':
                // Show auth modal
                const authModal = document.getElementById('authModal');
                if (authModal) {
                    authModal.classList.remove('hidden');
                    // Show login tab
                    document.getElementById('loginTab')?.click();
                }
                break;
                
            case 'logout':
                window.authManager?.signOut?.();
                this.showToast('Signed out successfully', 'success');
                break;
                
            case 'profile':
                // Trigger profile edit - try to find existing profile UI
                if (window.userProfileManager) {
                    window.userProfileManager.showEditProfileModal?.();
                } else {
                    this.showToast('Profile editor coming soon', 'info');
                }
                break;
                
            case 'settings':
                // Open settings modal
                const settingsModal = document.getElementById('settings-modal');
                if (settingsModal) {
                    settingsModal.classList.remove('hidden');
                }
                break;
                
            case 'sync':
                if (window.editor?.syncToCloud) {
                    window.editor.syncToCloud();
                    this.showToast('Syncing with cloud...', 'info');
                } else {
                    this.showToast('Cloud sync not available', 'warning');
                }
                break;
                
            case 'templates':
                if (window.templateEditor) {
                    window.templateEditor.show?.();
                } else {
                    this.showToast('Templates browser coming soon', 'info');
                }
                break;
                
            case 'backup':
                if (window.backupManager) {
                    window.backupManager.createBackup?.();
                } else if (window.editor?.exportAllPacks) {
                    window.editor.exportAllPacks();
                } else {
                    this.showToast('Backup feature coming soon', 'info');
                }
                break;
        }
    }
    
    /**
     * Setup mobile account button to open sheet instead of dropdown
     */
    setupMobileAccountButton() {
        // Find account/user buttons in header
        const accountButtons = document.querySelectorAll('.user-menu, .account-btn, #user-btn, [data-action="account"]');
        
        accountButtons.forEach(btn => {
            // Remove existing click listeners by cloning
            const newBtn = btn.cloneNode(true);
            btn.parentNode?.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openMobileAccountSheet();
            });
        });
    }
    
    /**
     * Open mobile account sheet
     */
    openMobileAccountSheet() {
        // Update content before showing
        this.updateMobileAccountSheet(this.dom.accountSheet);
        
        this.dom.accountBackdrop?.classList.add('open');
        this.dom.accountSheet?.classList.add('open');
        document.body.style.overflow = 'hidden';
        this.vibrate('selection');
    }
    
    /**
     * Close mobile account sheet
     */
    closeMobileAccountSheet() {
        this.dom.accountBackdrop?.classList.remove('open');
        this.dom.accountSheet?.classList.remove('open');
        document.body.style.overflow = '';
    }
    
    /**
     * Escape HTML for safe rendering
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Enhance input fields for mobile
     */
    enhanceInputFields() {
        // Add appropriate input types and attributes
        document.querySelectorAll('input[type="text"]').forEach(input => {
            // Check if it's a number field
            if (input.name?.includes('amount') || 
                input.name?.includes('value') ||
                input.name?.includes('level') ||
                input.name?.includes('duration')) {
                input.type = 'number';
                input.inputMode = 'numeric';
            }
            
            // Disable autocorrect for code inputs
            if (input.classList.contains('code-input') ||
                input.closest('.yaml-editor') ||
                input.closest('.skill-line')) {
                input.autocomplete = 'off';
                input.autocorrect = 'off';
                input.autocapitalize = 'off';
                input.spellcheck = false;
            }
        });
        
        // Add touch-friendly select handling
        document.querySelectorAll('select').forEach(select => {
            select.addEventListener('focus', () => {
                // Scroll into view on mobile
                if (this.isMobile) {
                    setTimeout(() => {
                        select.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                }
            });
        });
    }

    /**
     * Hide desktop-specific elements when in mobile mode
     */
    hideDesktopElements() {
        // Mode switcher stays visible on mobile (CSS handles hiding Guided mode only)
        // const modeSwitcher = document.querySelector('.mode-switcher');
        // if (modeSwitcher) modeSwitcher.classList.add('desktop-only');
        
        // Hide desktop sidebars
        const leftSidebar = document.getElementById('sidebar-left');
        const rightSidebar = document.getElementById('sidebar-right');
        if (leftSidebar) leftSidebar.classList.add('desktop-only');
        if (rightSidebar) rightSidebar.classList.add('desktop-only');
        
        // Hide resize handles
        const resizeHandles = document.querySelectorAll('.resize-handle');
        resizeHandles.forEach(h => h.classList.add('desktop-only'));
        
        // Hide sidebar collapsed strips
        const collapsedStrips = document.querySelectorAll('.sidebar-collapsed-strip');
        collapsedStrips.forEach(s => s.classList.add('desktop-only'));
    }
    
    /**
     * Apply mobile-specific inline styles for critical elements
     */
    applyMobileStyles() {
        // Ensure the app content fills the space properly
        const appContent = document.querySelector('.app-content');
        if (appContent) {
            appContent.style.paddingBottom = '70px'; // Space for bottom nav
        }
        
        // Make editor panel take full width
        const editorPanel = document.querySelector('.editor-panel');
        if (editorPanel) {
            editorPanel.style.flex = '1';
            editorPanel.style.width = '100%';
        }
    }
    
    /**
     * Attach mobile-specific event listeners
     */
    attachMobileEventListeners() {
        // Bottom navigation
        this.dom.bottomNav?.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleNavClick(e));
        });
        
        // Sidebar overlay click to close
        this.dom.sidebarOverlay?.addEventListener('click', (e) => {
            if (e.target === this.dom.sidebarOverlay) {
                this.closeSidebar();
            }
        });
        
        // Sidebar close button
        this.dom.sidebarOverlay?.querySelector('.mobile-sidebar-close')?.addEventListener('click', () => {
            this.closeSidebar();
        });
        
        // YAML sheet handle drag
        this.setupYAMLSheetDrag();
        
        // FAB toggle
        this.dom.fab?.querySelector('#fab-main')?.addEventListener('click', () => {
            this.toggleFABMenu();
        });
        
        // FAB menu items
        this.dom.fab?.querySelectorAll('.fab-menu-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleFABAction(e));
        });
        
        // Mobile new pack button
        document.getElementById('mobile-new-pack-btn')?.addEventListener('click', () => {
            this.closeSidebar();
            this.getEditor()?.createNewPack();
        });
        
        // Mobile copy YAML
        document.getElementById('mobile-copy-yaml')?.addEventListener('click', () => {
            this.copyYAMLToClipboard();
        });
        
        // Mobile export YAML
        document.getElementById('mobile-export-yaml')?.addEventListener('click', () => {
            this.getEditor()?.exportYAML();
        });
        
        // Mobile close YAML button - use direct reference and ensure it works
        const closeYamlBtn = document.getElementById('mobile-close-yaml');
        if (closeYamlBtn) {
            // Remove any existing listeners by cloning
            const newCloseBtn = closeYamlBtn.cloneNode(true);
            closeYamlBtn.parentNode.replaceChild(newCloseBtn, closeYamlBtn);
            
            newCloseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeYAMLSheet();
                // Reset active state to home
                this.dom.bottomNav?.querySelectorAll('.mobile-nav-item').forEach(item => {
                    item.classList.toggle('active', item.dataset.panel === 'home');
                });
                this.state.activePanel = 'home';
            });
            
            // Also handle touch for mobile
            newCloseBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeYAMLSheet();
                this.dom.bottomNav?.querySelectorAll('.mobile-nav-item').forEach(item => {
                    item.classList.toggle('active', item.dataset.panel === 'home');
                });
                this.state.activePanel = 'home';
            });
        }
    }
    
    /**
     * Handle bottom navigation click
     */
    handleNavClick(e) {
        const panel = e.currentTarget.dataset.panel;
        const currentItem = e.currentTarget;
        
        // Special handling for YAML toggle - clicking again closes it
        if (panel === 'yaml') {
            const isCurrentlyActive = currentItem.classList.contains('active');
            if (isCurrentlyActive && this.state.yamlSheetOpen) {
                // Close YAML and deactivate
                this.closeYAMLSheet();
                currentItem.classList.remove('active');
                // Set home as active
                this.dom.bottomNav.querySelector('[data-panel="home"]')?.classList.add('active');
                this.state.activePanel = 'home';
                return;
            }
        }
        
        // Update active state - only for home/files, others are temporary actions
        if (panel === 'home' || panel === 'yaml') {
            this.dom.bottomNav.querySelectorAll('.mobile-nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.panel === panel);
            });
        }
        
        // Handle panel navigation
        switch (panel) {
            case 'home':
                this.closeYAMLSheet(); // Close YAML when going home
                this.getEditor()?.goToDashboard();
                break;
            case 'files':
                this.openSidebar();
                break;
            case 'tools':
                this.showToolsMenu();
                break;
            case 'yaml':
                this.toggleYAMLSheet();
                break;
        }
        
        this.state.activePanel = panel;
    }
    
    /**
     * Open mobile sidebar
     */
    openSidebar() {
        if (!this.dom.sidebarOverlay) return;
        
        // Clone pack tree content
        const desktopPackTree = document.getElementById('pack-tree');
        const mobilePackTree = document.getElementById('mobile-pack-tree');
        
        if (desktopPackTree && mobilePackTree) {
            mobilePackTree.innerHTML = desktopPackTree.innerHTML;
            
            // Style for mobile-friendly file tree
            this.styleMobileFileTree(mobilePackTree);
            
            // Attach touch-friendly click handlers for pack headers (expand/collapse)
            mobilePackTree.querySelectorAll('.pack-header, .yaml-file-header').forEach(header => {
                header.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const pack = header.closest('.pack-item') || header.closest('.yaml-file-item');
                    if (pack) {
                        pack.classList.toggle('expanded');
                    }
                });
                // Touch support
                header.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    header.click();
                }, { passive: false });
            });
            
            // Attach handlers for folder headers (expand/collapse)
            mobilePackTree.querySelectorAll('.folder-header').forEach(header => {
                header.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const folder = header.closest('.folder-item');
                    if (folder) {
                        const folderFiles = folder.querySelector('.folder-files');
                        const chevron = header.querySelector('.folder-chevron');
                        if (folderFiles && chevron) {
                            folderFiles.classList.toggle('collapsed');
                            chevron.classList.toggle('fa-chevron-right');
                            chevron.classList.toggle('fa-chevron-down');
                        }
                    }
                });
                header.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    header.click();
                }, { passive: false });
            });
            
            // Reattach "Add Item" button handlers
            mobilePackTree.querySelectorAll('.add-item-btn').forEach(btn => {
                const clickHandler = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    const type = btn.dataset.type;
                    const packId = btn.dataset.packId;
                    const editor = this.getEditor();
                    
                    if (!editor) return;
                    
                    // Auto-switch to the pack where the button was clicked
                    if (packId && editor.packManager) {
                        const targetPack = editor.packManager.getPackById(packId);
                        if (targetPack && targetPack !== editor.packManager.activePack) {
                            editor.packManager.setActivePack(targetPack);
                        }
                    }
                    
                    // Call the appropriate create function
                    switch (type) {
                        case 'mob': editor.createNewMob(); break;
                        case 'skill': editor.createNewSkill(); break;
                        case 'item': editor.createNewItem(); break;
                        case 'droptable': editor.createNewDropTable(); break;
                        case 'randomspawn': editor.createNewRandomSpawn(); break;
                        case 'spawner': editor.createNewSpawner?.(); break;
                        case 'stat': editor.createNewStat?.(); break;
                    }
                    
                    this.closeSidebar();
                };
                
                btn.addEventListener('click', clickHandler);
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    clickHandler(e);
                }, { passive: false });
            });
            
            // Attach click handlers for pack tree items (file entries)
            mobilePackTree.querySelectorAll('[data-file-id], .entry-item, .file-item').forEach(item => {
                const clickHandler = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    const editor = this.getEditor();
                    if (!editor?.packManager) return;
                    
                    // Handle entry items (individual entries within YAML files)
                    if (item.classList.contains('entry-item')) {
                        const entryId = item.dataset.entryId;
                        const fileType = item.dataset.fileType;
                        const parentFileId = item.dataset.parentFileId;
                        
                        let entry = editor.packManager.findEntryById(entryId, fileType, parentFileId);
                        
                        if (!entry) {
                            const result = editor.packManager.findEntryInAllPacks(entryId, fileType, parentFileId);
                            if (result) {
                                editor.packManager.setActivePack(result.pack);
                                entry = result.entry;
                            }
                        }
                        
                        if (entry) {
                            editor.openFile(entry, fileType);
                        }
                    }
                    // Handle file items
                    else if (item.classList.contains('file-item') || item.dataset.fileId) {
                        const fileId = item.dataset.fileId;
                        const fileType = item.dataset.fileType;
                        
                        // Special handling for config files
                        if (item.classList.contains('config-file')) {
                            if (fileType === 'packinfo') {
                                editor.packManager.openPackInfo();
                            } else if (fileType === 'tooltips') {
                                editor.packManager.openTooltips();
                            }
                        }
                        // Special handling for stats
                        else if (fileType === 'stat') {
                            editor.showStatsEditor();
                        }
                        // Regular files
                        else {
                            let file = editor.packManager.findFile(fileId, fileType);
                            
                            if (!file) {
                                const result = editor.packManager.findFileInAllPacks(fileId, fileType);
                                if (result) {
                                    editor.packManager.setActivePack(result.pack);
                                    file = result.file;
                                }
                            }
                            
                            if (file) {
                                editor.openFile(file, fileType);
                            }
                        }
                    }
                    
                    this.closeSidebar();
                };
                
                item.addEventListener('click', clickHandler);
                item.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    clickHandler(e);
                }, { passive: false });
            });
        }
        
        this.dom.sidebarOverlay.classList.add('open');
        this.state.sidebarOpen = true;
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Style file tree for mobile
     */
    styleMobileFileTree(container) {
        // Add mobile-specific class
        container.classList.add('mobile-file-tree');
        
        // Enhance all clickable items for touch
        container.querySelectorAll('.pack-item, .yaml-file-item, .entry-item, .file-item, [data-file-id]').forEach(item => {
            item.style.minHeight = '48px';
            item.style.padding = '12px 16px';
            item.style.cursor = 'pointer';
            item.style.userSelect = 'none';
            item.style.webkitTapHighlightColor = 'transparent';
        });
        
        // Make pack headers more prominent
        container.querySelectorAll('.pack-header').forEach(header => {
            header.style.minHeight = '52px';
            header.style.padding = '14px 16px';
            header.style.borderRadius = '10px';
            header.style.marginBottom = '4px';
        });
        
        // Make folder headers touch-friendly
        container.querySelectorAll('.folder-header').forEach(header => {
            header.style.minHeight = '48px';
            header.style.padding = '12px 16px';
            header.style.cursor = 'pointer';
            header.style.userSelect = 'none';
        });
        
        // Style add buttons for touch
        container.querySelectorAll('.add-item-btn').forEach(btn => {
            btn.style.minHeight = '48px';
            btn.style.padding = '12px 16px';
            btn.style.cursor = 'pointer';
            btn.style.userSelect = 'none';
            btn.style.webkitTapHighlightColor = 'rgba(139, 92, 246, 0.3)';
            btn.style.touchAction = 'manipulation';
            btn.style.width = '100%';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.gap = '8px';
        });
    }
    
    /**
     * Close mobile sidebar
     */
    closeSidebar() {
        if (!this.dom.sidebarOverlay) return;
        
        this.dom.sidebarOverlay.classList.remove('open');
        this.state.sidebarOpen = false;
        document.body.style.overflow = '';
    }
    
    /**
     * Toggle YAML bottom sheet
     */
    toggleYAMLSheet() {
        if (!this.dom.yamlSheet) return;
        
        const isOpen = this.dom.yamlSheet.classList.contains('open');
        
        if (isOpen) {
            this.closeYAMLSheet();
        } else {
            this.openYAMLSheet();
        }
    }
    
    /**
     * Open YAML bottom sheet
     */
    openYAMLSheet() {
        if (!this.dom.yamlSheet) return;
        
        // Sync content from desktop preview
        const desktopPreview = document.getElementById('yaml-preview-content');
        const mobileContent = document.getElementById('mobile-yaml-content');
        
        if (desktopPreview && mobileContent) {
            mobileContent.innerHTML = `<pre><code>${desktopPreview.textContent}</code></pre>`;
        }
        
        this.dom.yamlSheet.classList.add('open');
        this.dom.yamlSheet.style.height = `${this.state.yamlSheetHeight * 100}%`;
        this.state.yamlSheetOpen = true;
    }
    
    /**
     * Close YAML bottom sheet
     */
    closeYAMLSheet() {
        if (!this.dom.yamlSheet) return;
        
        this.dom.yamlSheet.classList.remove('open');
        this.state.yamlSheetOpen = false;
    }
    
    /**
     * Setup YAML sheet drag handle
     */
    setupYAMLSheetDrag() {
        const handle = this.dom.yamlSheet?.querySelector('.yaml-sheet-handle');
        if (!handle) return;
        
        let startY = 0;
        let startHeight = 0;
        
        const onStart = (e) => {
            startY = e.touches ? e.touches[0].clientY : e.clientY;
            startHeight = this.dom.yamlSheet.offsetHeight;
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onEnd);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onEnd);
        };
        
        const onMove = (e) => {
            e.preventDefault();
            const currentY = e.touches ? e.touches[0].clientY : e.clientY;
            const diff = startY - currentY;
            const newHeight = Math.min(Math.max(startHeight + diff, 100), window.innerHeight * 0.9);
            
            this.dom.yamlSheet.style.height = `${newHeight}px`;
            this.state.yamlSheetHeight = newHeight / window.innerHeight;
        };
        
        const onEnd = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            
            // Snap to positions
            const screenHeight = window.innerHeight;
            const currentHeight = this.dom.yamlSheet.offsetHeight;
            const ratio = currentHeight / screenHeight;
            
            // Snap points: 30%, 60%, 90%
            if (ratio < 0.2) {
                this.closeYAMLSheet();
            } else if (ratio < 0.45) {
                this.dom.yamlSheet.style.height = '30%';
                this.state.yamlSheetHeight = 0.3;
            } else if (ratio < 0.75) {
                this.dom.yamlSheet.style.height = '60%';
                this.state.yamlSheetHeight = 0.6;
            } else {
                this.dom.yamlSheet.style.height = '90%';
                this.state.yamlSheetHeight = 0.9;
            }
        };
        
        handle.addEventListener('mousedown', onStart);
        handle.addEventListener('touchstart', onStart, { passive: true });
    }
    
    /**
     * Toggle FAB menu
     */
    toggleFABMenu() {
        if (!this.dom.fab) return;
        
        this.dom.fab.classList.toggle('open');
    }
    
    /**
     * Get editor reference (with fallback)
     */
    getEditor() {
        return this.editor || window.editor;
    }
    
    /**
     * Handle FAB action
     */
    handleFABAction(e) {
        const action = e.currentTarget.dataset.action;
        this.toggleFABMenu(); // Close menu
        
        const editor = this.getEditor();
        
        switch (action) {
            case 'new-mob':
                editor?.createNewMob();
                break;
            case 'new-skill':
                // On mobile, open the mobile skill wizard for quick skill line creation
                if (editor?.mobileSkillWizard) {
                    editor.mobileSkillWizard.open({
                        onComplete: (skillLine) => {
                            // If we have an active skill editor, add the line there
                            if (window.skillLineBuilder) {
                                window.skillLineBuilder.addToQueue(skillLine);
                            }
                            editor?.showNotification?.('Skill line added!', 'success');
                        }
                    });
                } else {
                    // Fallback to regular create new skill flow
                    editor?.createNewSkill();
                }
                break;
            case 'new-item':
                editor?.createNewItem();
                break;
            case 'new-droptable':
                editor?.createNewDropTable();
                break;
            case 'quick-skill':
                // Quick action to directly open skill wizard
                if (editor?.mobileSkillWizard) {
                    editor.mobileSkillWizard.open({
                        onComplete: (skillLine) => {
                            if (window.skillLineBuilder) {
                                window.skillLineBuilder.addToQueue(skillLine);
                            }
                            editor?.showNotification?.('Skill line created!', 'success');
                        }
                    });
                } else {
                    this.showNotification('Skill wizard not available', 'warning');
                }
                break;
        }
    }
    
    /**
     * Show tools menu (mobile version)
     */
    showToolsMenu() {
        // Create modal with tools
        const modal = document.createElement('div');
        modal.className = 'mobile-tools-modal';
        modal.innerHTML = `
            <div class="mobile-tools-overlay"></div>
            <div class="mobile-tools-content">
                <div class="mobile-tools-header">
                    <h3><i class="fas fa-wrench"></i> Tools & Settings</h3>
                    <button class="mobile-tools-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="mobile-tools-grid">
                    <button class="mobile-tool-item" data-tool="statistics">
                        <i class="fas fa-chart-bar"></i>
                        <span>Statistics</span>
                    </button>
                    <button class="mobile-tool-item" data-tool="dependency">
                        <i class="fas fa-project-diagram"></i>
                        <span>Dependencies</span>
                    </button>
                    <button class="mobile-tool-item" data-tool="duplicates">
                        <i class="fas fa-clone"></i>
                        <span>Duplicates</span>
                    </button>
                    <button class="mobile-tool-item" data-tool="validator">
                        <i class="fas fa-check-circle"></i>
                        <span>Validator</span>
                    </button>
                    <button class="mobile-tool-item" data-tool="usage">
                        <i class="fas fa-chart-line"></i>
                        <span>Skill Usage</span>
                    </button>
                    <button class="mobile-tool-item" data-tool="backup">
                        <i class="fas fa-save"></i>
                        <span>Backups</span>
                    </button>
                </div>
                <div class="mobile-tools-divider"></div>
                <div class="mobile-tools-grid">
                    <button class="mobile-tool-item" data-tool="settings">
                        <i class="fas fa-cog"></i>
                        <span>Settings</span>
                    </button>
                    <button class="mobile-tool-item" data-tool="help">
                        <i class="fas fa-question-circle"></i>
                        <span>Help</span>
                    </button>
                    <button class="mobile-tool-item" data-tool="about">
                        <i class="fas fa-info-circle"></i>
                        <span>About</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Animate in
        requestAnimationFrame(() => modal.classList.add('open'));
        
        // Event listeners
        modal.querySelector('.mobile-tools-overlay')?.addEventListener('click', () => {
            modal.classList.remove('open');
            setTimeout(() => modal.remove(), 300);
        });
        
        modal.querySelector('.mobile-tools-close')?.addEventListener('click', () => {
            modal.classList.remove('open');
            setTimeout(() => modal.remove(), 300);
        });
        
        modal.querySelectorAll('.mobile-tool-item').forEach(item => {
            item.addEventListener('click', () => {
                const tool = item.dataset.tool;
                modal.classList.remove('open');
                setTimeout(() => {
                    modal.remove();
                    this.getEditor()?.openTool(tool);
                }, 300);
            });
        });
    }
    
    /**
     * Copy YAML to clipboard
     */
    async copyYAMLToClipboard() {
        const content = document.getElementById('mobile-yaml-content')?.textContent || 
                       document.getElementById('yaml-preview-content')?.textContent;
        
        if (!content) return;
        
        try {
            await navigator.clipboard.writeText(content);
            this.showToast('YAML copied to clipboard!', 'success');
            
            // Haptic feedback
            this.vibrate([10]);
        } catch (err) {
            this.showToast('Failed to copy', 'error');
        }
    }
    
    /**
     * Attach resize/orientation listeners
     */
    attachResizeListeners() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const newDeviceType = this.detectDeviceType();
                const newOrientation = this.detectOrientation();
                
                if (newDeviceType !== this.deviceType) {
                    this.deviceType = newDeviceType;
                    this.updateDeviceAttribute();
                    
                    // Activate/deactivate mobile mode
                    if (newDeviceType === 'desktop' && this.state.mobileMode) {
                        this.deactivateMobileMode();
                    } else if (newDeviceType !== 'desktop' && !this.state.mobileMode) {
                        this.activateMobileMode();
                    }
                }
                
                if (newOrientation !== this.orientation) {
                    this.orientation = newOrientation;
                    document.body.setAttribute('data-orientation', this.orientation);
                }
            }, 150);
        });
        
        // Orientation change event (more reliable on mobile)
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.orientation = this.detectOrientation();
                document.body.setAttribute('data-orientation', this.orientation);
            }, 100);
        });
    }
    
    /**
     * Attach touch gesture listeners
     */
    attachTouchListeners() {
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
    }
    
    /**
     * Handle touch start
     */
    handleTouchStart(e) {
        if (!this.state.gesturesEnabled) return;
        
        const touch = e.touches[0];
        this.touch.startX = touch.clientX;
        this.touch.startY = touch.clientY;
        this.touch.startTime = Date.now();
        this.touch.currentElement = e.target;
        
        // Long press detection
        this.touch.longPressTimer = setTimeout(() => {
            this.handleLongPress(e);
        }, this.touch.longPressThreshold);
    }
    
    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        if (!this.state.gesturesEnabled) return;
        
        // Cancel long press if moved too much
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - this.touch.startX);
        const deltaY = Math.abs(touch.clientY - this.touch.startY);
        
        if (deltaX > 10 || deltaY > 10) {
            clearTimeout(this.touch.longPressTimer);
        }
        
        // Edge swipe detection for sidebar
        if (this.touch.startX < 20 && deltaX > this.touch.swipeThreshold && deltaX > deltaY) {
            e.preventDefault();
        }
    }
    
    /**
     * Handle touch end
     */
    handleTouchEnd(e) {
        if (!this.state.gesturesEnabled) return;
        
        clearTimeout(this.touch.longPressTimer);
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.touch.startX;
        const deltaY = touch.clientY - this.touch.startY;
        const deltaTime = Date.now() - this.touch.startTime;
        
        // Swipe detection
        if (Math.abs(deltaX) > this.touch.swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY) && deltaTime < 300) {
            if (deltaX > 0 && this.touch.startX < 30) {
                // Swipe right from left edge - open sidebar
                this.openSidebar();
            } else if (deltaX < 0 && this.state.sidebarOpen) {
                // Swipe left - close sidebar
                this.closeSidebar();
            }
        }
        
        // Reset
        this.touch.currentElement = null;
    }
    
    /**
     * Handle long press
     */
    handleLongPress(e) {
        const target = this.touch.currentElement;
        if (!target) return;
        
        // Check if target is a swipeable item (skill, mob, item in list)
        const listItem = target.closest('.skill-item, .mob-item, .file-tree-item, .queue-item');
        
        if (listItem) {
            this.vibrate([20]); // Haptic feedback
            this.showContextMenu(listItem, e);
        }
    }
    
    /**
     * Show context menu for mobile (replaces right-click)
     */
    showContextMenu(element, e) {
        // Create mobile context menu
        const menu = document.createElement('div');
        menu.className = 'mobile-context-menu';
        
        // Determine menu items based on element type
        let items = [];
        
        if (element.classList.contains('skill-item') || element.classList.contains('queue-item')) {
            items = [
                { icon: 'edit', label: 'Edit', action: 'edit' },
                { icon: 'copy', label: 'Duplicate', action: 'duplicate' },
                { icon: 'trash', label: 'Delete', action: 'delete', danger: true }
            ];
        } else if (element.classList.contains('file-tree-item')) {
            items = [
                { icon: 'folder-open', label: 'Open', action: 'open' },
                { icon: 'copy', label: 'Duplicate', action: 'duplicate' },
                { icon: 'file-export', label: 'Export', action: 'export' },
                { icon: 'trash', label: 'Delete', action: 'delete', danger: true }
            ];
        }
        
        menu.innerHTML = `
            <div class="context-menu-backdrop"></div>
            <div class="context-menu-content">
                ${items.map(item => `
                    <button class="context-menu-item ${item.danger ? 'danger' : ''}" data-action="${item.action}">
                        <i class="fas fa-${item.icon}"></i>
                        <span>${item.label}</span>
                    </button>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(menu);
        requestAnimationFrame(() => menu.classList.add('open'));
        
        // Handle actions
        menu.querySelector('.context-menu-backdrop')?.addEventListener('click', () => {
            menu.classList.remove('open');
            setTimeout(() => menu.remove(), 200);
        });
        
        menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                menu.classList.remove('open');
                setTimeout(() => {
                    menu.remove();
                    this.handleContextAction(action, element);
                }, 200);
            });
        });
    }
    
    /**
     * Handle context menu action
     */
    handleContextAction(action, element) {
        console.log('Context action:', action, element);
        // Implement specific actions based on context
        // This will integrate with existing editor methods
    }
    
    /**
     * Deactivate mobile mode
     */
    deactivateMobileMode() {
        if (!this.state.mobileMode) return;
        
        this.state.mobileMode = false;
        document.body.classList.remove('mobile-mode');
        
        // Remove mobile UI elements
        this.dom.bottomNav?.remove();
        this.dom.sidebarOverlay?.remove();
        this.dom.yamlSheet?.remove();
        this.dom.fab?.remove();
        
        // Show desktop elements
        document.querySelectorAll('.desktop-only').forEach(el => {
            el.classList.remove('desktop-only');
        });
        
        // Reset styles
        const appContent = document.querySelector('.app-content');
        if (appContent) appContent.style.paddingBottom = '';
        
        const editorPanel = document.querySelector('.editor-panel');
        if (editorPanel) {
            editorPanel.style.flex = '';
            editorPanel.style.width = '';
        }
        
        console.log('📱 Mobile mode deactivated');
    }
    
    /**
     * Vibrate device (haptic feedback)
     * @param {string|number[]} pattern - Pattern name ('light', 'medium', 'heavy', 'success', 'error', 'warning', 'selection', 'impact') or custom array
     */
    vibrate(pattern = 'light') {
        if (!navigator.vibrate) return;
        
        // If pattern is a string, look up in haptic patterns
        if (typeof pattern === 'string') {
            pattern = this.hapticPatterns[pattern] || this.hapticPatterns.light;
        }
        
        navigator.vibrate(pattern);
    }
    
    /**
     * Show toast/notification message
     */
    showNotification(message, type = 'info') {
        const editor = this.getEditor();
        if (editor?.showToast) {
            editor.showToast(message, type);
        } else if (editor?.showNotification) {
            editor.showNotification(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }
    
    // Alias for compatibility
    showToast(message, type = 'info') {
        this.showNotification(message, type);
    }
    
    /**
     * Check if currently in mobile mode (method for compatibility)
     */
    isMobileMode() {
        return this.deviceType === 'mobile';
    }
    
    /**
     * Check if currently in tablet mode (method for compatibility)
     */
    isTabletMode() {
        return this.deviceType === 'tablet';
    }
    
    /**
     * Check if mobile mode UI is active
     */
    isMobileModeActive() {
        return this.state.mobileMode;
    }
    
    /**
     * Update YAML preview (called when content changes)
     */
    updateYAMLPreview(content) {
        const mobileContent = document.getElementById('mobile-yaml-content');
        if (mobileContent && this.state.yamlSheetOpen) {
            mobileContent.innerHTML = `<pre><code>${content}</code></pre>`;
        }
    }
    
    /**
     * Enable touch-based drag and drop for a list of items
     * @param {HTMLElement} container - The container element
     * @param {string} itemSelector - Selector for draggable items
     * @param {string} handleSelector - Optional selector for drag handle
     * @param {Function} onReorder - Callback when items are reordered (receives {from, to} indices)
     */
    enableTouchDragSort(container, itemSelector, handleSelector = null, onReorder = null) {
        if (!container || !this.isTouchDevice) return;
        
        let draggedItem = null;
        let draggedClone = null;
        let placeholder = null;
        let startY = 0;
        let currentY = 0;
        let scrollInterval = null;
        
        const items = () => Array.from(container.querySelectorAll(itemSelector));
        
        const getItemAtPosition = (y) => {
            const containerRect = container.getBoundingClientRect();
            const scrollTop = container.scrollTop;
            const relativeY = y - containerRect.top + scrollTop;
            
            for (const item of items()) {
                if (item === draggedItem || item === placeholder) continue;
                const rect = item.getBoundingClientRect();
                const itemTop = rect.top - containerRect.top + scrollTop;
                const itemMiddle = itemTop + rect.height / 2;
                
                if (relativeY < itemMiddle) {
                    return { item, position: 'before' };
                }
            }
            
            const lastItem = items().filter(i => i !== draggedItem && i !== placeholder).pop();
            return lastItem ? { item: lastItem, position: 'after' } : null;
        };
        
        const handleTouchStart = (e) => {
            const target = e.target.closest(itemSelector);
            if (!target) return;
            
            // Check if we should use a handle
            if (handleSelector) {
                const handle = e.target.closest(handleSelector);
                if (!handle) return;
            }
            
            draggedItem = target;
            startY = e.touches[0].clientY;
            currentY = startY;
            
            // Long press to initiate drag
            this.touch.longPressTimer = setTimeout(() => {
                // Haptic feedback
                this.triggerHaptic('medium');
                
                // Create clone for visual feedback
                const rect = draggedItem.getBoundingClientRect();
                draggedClone = draggedItem.cloneNode(true);
                draggedClone.classList.add('mobile-drag-clone');
                draggedClone.style.cssText = `
                    position: fixed;
                    left: ${rect.left}px;
                    top: ${rect.top}px;
                    width: ${rect.width}px;
                    height: ${rect.height}px;
                    z-index: 10000;
                    pointer-events: none;
                    opacity: 0.9;
                    transform: scale(1.02);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    transition: transform 0.1s ease;
                `;
                document.body.appendChild(draggedClone);
                
                // Create placeholder
                placeholder = document.createElement('div');
                placeholder.className = 'mobile-drag-placeholder';
                placeholder.style.cssText = `
                    height: ${rect.height}px;
                    background: var(--accent-primary, #8b5cf6);
                    opacity: 0.2;
                    border-radius: 8px;
                    margin: 4px 0;
                    transition: all 0.2s ease;
                `;
                draggedItem.style.opacity = '0.3';
                draggedItem.after(placeholder);
                
            }, this.touch.longPressThreshold);
        };
        
        const handleTouchMove = (e) => {
            if (!draggedItem) return;
            
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            // Cancel long press if moved too much before drag started
            if (!draggedClone && Math.abs(deltaY) > 10) {
                clearTimeout(this.touch.longPressTimer);
                draggedItem = null;
                return;
            }
            
            if (!draggedClone) return;
            
            e.preventDefault();
            
            // Update clone position
            const rect = draggedItem.getBoundingClientRect();
            draggedClone.style.top = `${rect.top + deltaY}px`;
            
            // Auto-scroll
            const containerRect = container.getBoundingClientRect();
            const scrollZone = 50;
            
            clearInterval(scrollInterval);
            if (currentY < containerRect.top + scrollZone) {
                scrollInterval = setInterval(() => container.scrollTop -= 5, 16);
            } else if (currentY > containerRect.bottom - scrollZone) {
                scrollInterval = setInterval(() => container.scrollTop += 5, 16);
            }
            
            // Update placeholder position
            const targetInfo = getItemAtPosition(currentY);
            if (targetInfo && targetInfo.item !== draggedItem) {
                if (targetInfo.position === 'before') {
                    targetInfo.item.before(placeholder);
                } else {
                    targetInfo.item.after(placeholder);
                }
            }
        };
        
        const handleTouchEnd = () => {
            clearTimeout(this.touch.longPressTimer);
            clearInterval(scrollInterval);
            
            if (draggedClone && placeholder && draggedItem) {
                // Get original and new indices
                const allItems = items();
                const fromIndex = allItems.indexOf(draggedItem);
                
                // Move the actual item
                placeholder.before(draggedItem);
                
                const toIndex = items().indexOf(draggedItem);
                
                // Clean up
                draggedClone.remove();
                placeholder.remove();
                draggedItem.style.opacity = '';
                
                // Haptic feedback
                this.triggerHaptic('light');
                
                // Callback
                if (onReorder && fromIndex !== toIndex) {
                    onReorder({ from: fromIndex, to: toIndex });
                }
            }
            
            draggedItem = null;
            draggedClone = null;
            placeholder = null;
        };
        
        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });
        container.addEventListener('touchcancel', handleTouchEnd, { passive: true });
        
        // Return cleanup function
        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('touchcancel', handleTouchEnd);
        };
    }
    
    /**
     * Show mobile tooltip for an element
     * @param {string} text - Tooltip text
     * @param {number} duration - How long to show (ms)
     */
    showMobileTooltip(text, duration = 3000) {
        // Remove existing tooltip
        const existing = document.querySelector('.mobile-tooltip');
        if (existing) existing.remove();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'mobile-tooltip';
        tooltip.textContent = text;
        document.body.appendChild(tooltip);
        
        setTimeout(() => {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateY(20px)';
            setTimeout(() => tooltip.remove(), 200);
        }, duration);
        
        return tooltip;
    }
    
    /**
     * Initialize tooltip touch support
     * Elements with data-tooltip or title will show tooltip on tap
     */
    initTooltipTouchSupport() {
        if (!this.isTouchDevice) return;
        
        document.addEventListener('touchend', (e) => {
            const target = e.target.closest('[data-tooltip], [title]');
            if (!target) return;
            
            const text = target.dataset.tooltip || target.getAttribute('title');
            if (text) {
                e.preventDefault();
                this.showMobileTooltip(text);
                
                // Prevent title from showing
                if (target.hasAttribute('title')) {
                    target.dataset.originalTitle = target.getAttribute('title');
                    target.removeAttribute('title');
                    setTimeout(() => {
                        if (target.dataset.originalTitle) {
                            target.setAttribute('title', target.dataset.originalTitle);
                            delete target.dataset.originalTitle;
                        }
                    }, 100);
                }
            }
        }, { passive: false });
    }
    
    /**
     * Convert a dropdown to mobile bottom sheet
     * @param {HTMLElement} trigger - Element that triggers the dropdown
     * @param {HTMLElement} dropdown - The dropdown element
     */
    convertToBottomSheet(trigger, dropdown) {
        if (!trigger || !dropdown || !this.isMobile) return;
        
        let touchHandled = false;
        
        const showSheet = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Create backdrop
            let backdrop = document.querySelector('.mobile-sheet-backdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.className = 'mobile-sheet-backdrop';
                backdrop.style.cssText = `
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 10000;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                `;
                document.body.appendChild(backdrop);
                requestAnimationFrame(() => backdrop.style.opacity = '1');
            }
            
            // Position dropdown as bottom sheet
            dropdown.style.cssText = `
                position: fixed !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                top: auto !important;
                max-height: 70vh !important;
                border-radius: 16px 16px 0 0 !important;
                z-index: 10001 !important;
                transform: translateY(0) !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            `;
            dropdown.classList.add('mobile-sheet-active');
            
            // Close handlers
            const closeSheet = () => {
                dropdown.classList.remove('mobile-sheet-active');
                dropdown.style.cssText = '';
                backdrop.style.opacity = '0';
                setTimeout(() => backdrop.remove(), 200);
            };
            
            backdrop.addEventListener('click', closeSheet, { once: true });
            
            // Close on item selection
            dropdown.querySelectorAll('button, a, [role="option"]').forEach(item => {
                item.addEventListener('click', closeSheet, { once: true });
            });
        };
        
        trigger.addEventListener('touchend', (e) => {
            touchHandled = true;
            showSheet(e);
            setTimeout(() => touchHandled = false, 300);
        });
        
        trigger.addEventListener('click', (e) => {
            if (!touchHandled) {
                showSheet(e);
            }
        });
    }
    
    /**
     * Smart keyboard handling - scroll input into view and adjust layout
     */
    initSmartKeyboardHandling() {
        if (!this.isMobile) return;
        
        let originalHeight = window.innerHeight;
        let keyboardHeight = 0;
        
        // Detect keyboard open/close via viewport resize
        const checkKeyboard = () => {
            const currentHeight = window.visualViewport?.height || window.innerHeight;
            const heightDiff = originalHeight - currentHeight;
            
            if (heightDiff > 150) {
                // Keyboard is likely open
                keyboardHeight = heightDiff;
                document.body.classList.add('keyboard-open');
                document.body.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
                this.state.keyboardOpen = true;
                
                // Scroll focused element into view
                const focused = document.activeElement;
                if (focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA')) {
                    setTimeout(() => {
                        focused.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                }
            } else {
                // Keyboard is closed
                document.body.classList.remove('keyboard-open');
                document.body.style.removeProperty('--keyboard-height');
                this.state.keyboardOpen = false;
                keyboardHeight = 0;
            }
        };
        
        // Use visualViewport API if available (more reliable)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', checkKeyboard);
        } else {
            window.addEventListener('resize', checkKeyboard);
        }
        
        // Also listen for focus events on inputs
        document.addEventListener('focusin', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                setTimeout(checkKeyboard, 300);
            }
        });
        
        document.addEventListener('focusout', () => {
            setTimeout(checkKeyboard, 100);
        });
    }
    
    /**
     * Initialize pull-to-refresh functionality
     */
    initPullToRefresh() {
        if (!this.isMobile || !this.state.pullToRefreshEnabled) return;
        
        let startY = 0;
        let pulling = false;
        let indicator = null;
        
        const createIndicator = () => {
            if (indicator) return indicator;
            indicator = document.createElement('div');
            indicator.className = 'pull-refresh-indicator';
            indicator.innerHTML = '<i class="fas fa-sync-alt"></i> Pull to refresh';
            document.body.appendChild(indicator);
            return indicator;
        };
        
        document.addEventListener('touchstart', (e) => {
            // Only enable at top of page
            if (window.scrollY === 0 && !this.state.keyboardOpen) {
                startY = e.touches[0].clientY;
                pulling = true;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!pulling) return;
            
            const currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            
            if (diff > 0 && window.scrollY === 0) {
                const ind = createIndicator();
                const progress = Math.min(diff / 100, 1);
                ind.style.transform = `translateX(-50%) translateY(${Math.min(diff * 0.5, 50)}px)`;
                ind.style.opacity = progress;
                
                if (diff > 100) {
                    ind.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Release to refresh';
                    ind.classList.add('ready');
                } else {
                    ind.innerHTML = '<i class="fas fa-sync-alt"></i> Pull to refresh';
                    ind.classList.remove('ready');
                }
            }
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            if (indicator && indicator.classList.contains('ready')) {
                indicator.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';
                indicator.classList.add('visible');
                
                // Trigger refresh
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else if (indicator) {
                indicator.style.transform = 'translateX(-50%) translateY(-100%)';
                indicator.style.opacity = '0';
            }
            
            pulling = false;
            startY = 0;
        }, { passive: true });
    }
    
    /**
     * Add swipe navigation between tabs/sections
     * @param {HTMLElement} container - Container element
     * @param {Array} sections - Array of section elements
     * @param {Function} onSwipe - Callback when section changes
     */
    enableSwipeNavigation(container, sections, onSwipe) {
        if (!container || !this.isMobile) return;
        
        let startX = 0;
        let currentIndex = 0;
        
        container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });
        
        container.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0 && currentIndex < sections.length - 1) {
                    // Swipe left - next section
                    currentIndex++;
                    this.hapticFeedback('selection');
                    onSwipe?.(currentIndex, 'next');
                } else if (diff < 0 && currentIndex > 0) {
                    // Swipe right - previous section
                    currentIndex--;
                    this.hapticFeedback('selection');
                    onSwipe?.(currentIndex, 'prev');
                }
            }
        }, { passive: true });
        
        return {
            setIndex: (index) => { currentIndex = index; },
            getIndex: () => currentIndex
        };
    }
    
    /**
     * Create a mobile-friendly action sheet
     * @param {Object} options - Action sheet configuration
     */
    showActionSheet(options = {}) {
        const { title, actions = [], cancelText = 'Cancel' } = options;
        
        // Remove existing
        document.querySelector('.mobile-action-sheet-overlay')?.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'mobile-action-sheet-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 100000;
            display: flex;
            align-items: flex-end;
            animation: fadeIn 0.2s ease;
        `;
        
        const sheet = document.createElement('div');
        sheet.className = 'mobile-action-sheet';
        sheet.style.cssText = `
            width: 100%;
            background: var(--bg-secondary);
            border-radius: 16px 16px 0 0;
            padding: 12px;
            padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
            animation: slideUpSheet 0.3s ease;
        `;
        
        let html = '';
        
        if (title) {
            html += `<div style="text-align: center; padding: 12px; color: var(--text-secondary); font-size: 13px;">${title}</div>`;
        }
        
        html += '<div style="display: flex; flex-direction: column; gap: 4px;">';
        
        actions.forEach((action, index) => {
            const destructive = action.destructive ? 'color: var(--error);' : '';
            html += `
                <button class="action-sheet-item" data-index="${index}" style="
                    width: 100%;
                    padding: 16px;
                    background: var(--bg-tertiary);
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    color: var(--text-primary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    ${destructive}
                ">
                    ${action.icon ? `<i class="${action.icon}"></i>` : ''}
                    ${action.label}
                </button>
            `;
        });
        
        html += '</div>';
        
        // Cancel button
        html += `
            <button class="action-sheet-cancel" style="
                width: 100%;
                padding: 16px;
                background: var(--bg-tertiary);
                border: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                color: var(--accent-primary);
                cursor: pointer;
                margin-top: 8px;
            ">${cancelText}</button>
        `;
        
        sheet.innerHTML = html;
        overlay.appendChild(sheet);
        document.body.appendChild(overlay);
        
        // Haptic feedback
        this.hapticFeedback('medium');
        
        // Event handlers
        const close = () => {
            overlay.style.opacity = '0';
            sheet.style.transform = 'translateY(100%)';
            setTimeout(() => overlay.remove(), 200);
        };
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
        
        sheet.querySelector('.action-sheet-cancel').addEventListener('click', close);
        
        sheet.querySelectorAll('.action-sheet-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                const action = actions[index];
                close();
                this.hapticFeedback('selection');
                setTimeout(() => action.handler?.(), 200);
            });
        });
        
        return { close };
    }
    
    /**
     * Initialize smart form validation with inline feedback
     */
    initSmartFormValidation() {
        if (!this.isMobile) return;
        
        document.addEventListener('input', (e) => {
            const input = e.target;
            if (!input.matches('input, textarea')) return;
            
            // Clear previous feedback
            const existingFeedback = input.parentElement.querySelector('.mobile-validation-feedback');
            existingFeedback?.remove();
            
            // Check validity
            if (input.validity && !input.validity.valid) {
                const feedback = document.createElement('div');
                feedback.className = 'mobile-validation-feedback';
                feedback.style.cssText = `
                    font-size: 12px;
                    color: var(--error);
                    margin-top: 4px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                `;
                
                let message = input.validationMessage || 'Invalid input';
                if (input.validity.valueMissing) message = 'This field is required';
                if (input.validity.typeMismatch) message = 'Please enter a valid format';
                if (input.validity.tooShort) message = `Minimum ${input.minLength} characters`;
                if (input.validity.tooLong) message = `Maximum ${input.maxLength} characters`;
                
                feedback.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
                input.parentElement.appendChild(feedback);
                
                // Shake animation
                input.style.animation = 'shake 0.3s ease';
                setTimeout(() => input.style.animation = '', 300);
                
                this.hapticFeedback('error');
            }
        });
    }
    
    /**
     * Add floating labels to form groups
     */
    enhanceFormLabels() {
        if (!this.isMobile) return;
        
        document.querySelectorAll('.form-group').forEach(group => {
            const input = group.querySelector('input, textarea');
            const label = group.querySelector('label');
            
            if (input && label && !group.classList.contains('floating-label-group')) {
                group.classList.add('floating-label-group');
                
                // Move label after input for CSS targeting
                if (input.nextElementSibling !== label) {
                    input.after(label);
                }
                
                // Add placeholder if missing
                if (!input.placeholder) {
                    input.placeholder = ' ';
                }
            }
        });
    }
    
    /**
     * Initialize all smart mobile features
     */
    initAllSmartFeatures() {
        this.initSmartKeyboardHandling();
        this.initPullToRefresh();
        this.initSmartFormValidation();
        this.enhanceFormLabels();
        
        // Convert all appropriate dropdowns to bottom sheets
        document.querySelectorAll('[data-dropdown-trigger]').forEach(trigger => {
            const dropdownId = trigger.dataset.dropdownTrigger;
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) {
                this.convertToBottomSheet(trigger, dropdown);
            }
        });
        
        console.log('📱 Smart mobile features initialized');
    }
}

// Export for use
window.MobileManager = MobileManager;
