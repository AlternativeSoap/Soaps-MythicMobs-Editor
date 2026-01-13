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
        
        // Re-detect after DOM is ready (more accurate detection)
        // This catches cases where constructor detection was too early
        this.isTouchDevice = this.detectTouchSupport();
        this.deviceType = this.detectDeviceType();
        this.isMobile = this.deviceType === 'mobile';
        this.isTablet = this.deviceType === 'tablet';
        this.isDesktop = this.deviceType === 'desktop';
        
        // Set device attribute on body
        this.updateDeviceAttribute();
        
        // CRITICAL: Initialize Universal Touch System FIRST (before any UI)
        if (this.isTouchDevice) {
            this.initUniversalTouchSystem();
        }
        
        // Activate mobile mode for mobile/tablet OR touch devices with medium screens
        // This covers cases where UA detection fails but touch is detected
        const shouldActivateMobile = this.deviceType !== 'desktop' || 
                                     (this.isTouchDevice && window.innerWidth < this.breakpoints.tablet);
        
        if (shouldActivateMobile) {
            this.activateMobileMode();
            // Setup swipeable toasts for mobile
            this.setupSwipeableToasts();
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
        
        // Setup pull-to-refresh (disabled - too many issues)
        // if (this.deviceType !== 'desktop') {
        //     this.setupPullToRefresh();
        // }
        
        // Load action history for smart suggestions
        this.loadActionHistory();
        
        console.log(`📱 MobileManager initialized: ${this.deviceType}, touch: ${this.isTouchDevice}, mobileMode: ${this.state.mobileMode}`);
    }
    
    /**
     * ===================================
     * UNIVERSAL TOUCH & GESTURE TRACKING SYSTEM
     * ===================================
     * Centralized tracking for ALL touch, scroll, and gesture interactions
     * Features:
     * - Global touch state accessible anywhere via window.touchTracker
     * - Automatic scroll vs tap detection
     * - Multi-touch gesture support
     * - Velocity tracking for swipe detection
     * - Long-press detection
     * - Double-tap detection
     * - Prevents accidental clicks during scroll
     */
    initUniversalTouchSystem() {
        console.log('📱 Initializing Universal Touch & Gesture Tracking System...');
        
        // Create global touch tracker accessible from anywhere
        this.touchTracker = {
            // Current touch state
            isTracking: false,
            isTouching: false,
            isScrolling: false,
            isLongPress: false,
            isPinching: false,
            
            // Touch position data
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            deltaX: 0,
            deltaY: 0,
            
            // Touch timing
            startTime: 0,
            lastTapTime: 0,
            lastTouchEnd: 0,
            touchDuration: 0,
            
            // Velocity tracking (for swipe detection)
            velocityX: 0,
            velocityY: 0,
            lastMoveTime: 0,
            
            // Multi-touch
            touchCount: 0,
            initialPinchDistance: 0,
            currentPinchDistance: 0,
            pinchScale: 1,
            
            // Target tracking
            startTarget: null,
            currentTarget: null,
            interactiveTarget: null,
            
            // Gesture detection results
            gesture: {
                type: 'none', // 'tap', 'double-tap', 'long-press', 'swipe-left', 'swipe-right', 'swipe-up', 'swipe-down', 'scroll', 'pinch'
                detected: false,
                direction: null,
                distance: 0,
                velocity: 0
            },
            
            // Configuration
            config: {
                scrollThreshold: 10,      // px movement to consider as scroll
                swipeThreshold: 50,       // px movement to consider as swipe
                swipeVelocityThreshold: 0.3, // px/ms velocity for swipe
                longPressDelay: 500,      // ms to trigger long press
                doubleTapDelay: 300,      // ms between taps for double-tap
                tapMaxDuration: 300,      // max ms for a tap
                clickBlockDelay: 350      // ms to block clicks after touch
            },
            
            // Event callbacks (can be set externally)
            onTouchStart: null,
            onTouchMove: null,
            onTouchEnd: null,
            onGesture: null,
            onScroll: null,
            
            // Helper methods
            isValidTap() {
                return !this.isScrolling && 
                       this.touchDuration < this.config.tapMaxDuration &&
                       Math.abs(this.deltaX) < this.config.scrollThreshold &&
                       Math.abs(this.deltaY) < this.config.scrollThreshold;
            },
            
            isSwipe() {
                const distance = Math.sqrt(this.deltaX ** 2 + this.deltaY ** 2);
                const velocity = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
                return distance > this.config.swipeThreshold || velocity > this.config.swipeVelocityThreshold;
            },
            
            getSwipeDirection() {
                if (Math.abs(this.deltaX) > Math.abs(this.deltaY)) {
                    return this.deltaX > 0 ? 'right' : 'left';
                } else {
                    return this.deltaY > 0 ? 'down' : 'up';
                }
            },
            
            shouldBlockClick() {
                return Date.now() - this.lastTouchEnd < this.config.clickBlockDelay;
            },
            
            reset() {
                this.isTracking = false;
                this.isTouching = false;
                this.isScrolling = false;
                this.isLongPress = false;
                this.isPinching = false;
                this.deltaX = 0;
                this.deltaY = 0;
                this.velocityX = 0;
                this.velocityY = 0;
                this.touchCount = 0;
                this.startTarget = null;
                this.currentTarget = null;
                this.interactiveTarget = null;
                this.gesture.type = 'none';
                this.gesture.detected = false;
            }
        };
        
        // Expose globally
        window.touchTracker = this.touchTracker;
        
        // Legacy compatibility
        this.touchState = {
            get touchStartTime() { return window.touchTracker.startTime; },
            get touchTarget() { return window.touchTracker.interactiveTarget; },
            get touchHandled() { return window.touchTracker.gesture.detected; },
            get lastTouchEnd() { return window.touchTracker.lastTouchEnd; },
            get touchStartX() { return window.touchTracker.startX; },
            get touchStartY() { return window.touchTracker.startY; },
            get isTouchScrolling() { return window.touchTracker.isScrolling; }
        };
        
        // Long press timer
        this._longPressTimer = null;
        
        // Remove ALL title attributes on touch devices (prevents tooltips)
        this.removeAllTitles();
        
        // Global touch interceptor for all interactive elements
        document.addEventListener('touchstart', (e) => this.handleGlobalTouchStart(e), { passive: true, capture: true });
        document.addEventListener('touchmove', (e) => this.handleGlobalTouchMove(e), { passive: true, capture: true });
        document.addEventListener('touchend', (e) => this.handleGlobalTouchEnd(e), { passive: false, capture: true });
        document.addEventListener('touchcancel', (e) => this.handleGlobalTouchCancel(e), { passive: true, capture: true });
        document.addEventListener('click', (e) => this.handleGlobalClick(e), { capture: true });
        
        // Also track scroll events globally
        document.addEventListener('scroll', (e) => this.handleGlobalScroll(e), { passive: true, capture: true });
        
        // Observe DOM for new elements
        this.observeForNewElements();
        
        // Setup header dropdowns for mobile (single-tap + click-outside-to-close)
        this.setupMobileHeaderDropdowns();
        
        console.log('📱 Universal Touch & Gesture Tracking System ready');
        console.log('📱 Access global state via: window.touchTracker');
    }
    
    /**
     * Remove all title attributes on touch devices
     * Prevents annoying tooltip popups on touch
     */
    removeAllTitles() {
        // Remove existing titles
        document.querySelectorAll('[title]').forEach(el => {
            el.dataset.originalTitle = el.getAttribute('title');
            el.removeAttribute('title');
        });
    }
    
    /**
     * Observe DOM for new elements and remove their titles
     */
    observeForNewElements() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        // Remove titles from new elements
                        if (node.hasAttribute?.('title')) {
                            node.dataset.originalTitle = node.getAttribute('title');
                            node.removeAttribute('title');
                        }
                        node.querySelectorAll?.('[title]').forEach(el => {
                            el.dataset.originalTitle = el.getAttribute('title');
                            el.removeAttribute('title');
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    /**
     * Setup mobile-friendly header dropdowns (Mode, Profile, Tools)
     * Single tap to toggle, tap anywhere outside to close
     */
    setupMobileHeaderDropdowns() {
        console.log('📱 Setting up mobile header dropdowns...');
        
        // Track all open dropdowns for click-outside handling
        const closeAllDropdowns = (exceptElement) => {
            // Close user dropdown
            const userDropdown = document.getElementById('user-dropdown');
            if (userDropdown && !exceptElement?.closest('.user-account')) {
                userDropdown.classList.remove('show');
            }
            
            // Close mode dropdown
            const modeDropdown = document.getElementById('mode-dropdown');
            if (modeDropdown && !exceptElement?.closest('.mode-switcher')) {
                modeDropdown.classList.remove('visible');
            }
            
            // Close tools dropdown
            const toolsDropdown = document.getElementById('tools-dropdown');
            if (toolsDropdown && !exceptElement?.closest('.tools-menu')) {
                toolsDropdown.classList.remove('show');
            }
        };
        
        // User Account Button - single tap toggle
        const userAccountBtn = document.getElementById('user-account-btn');
        if (userAccountBtn) {
            // Remove existing handlers by cloning
            const newUserBtn = userAccountBtn.cloneNode(true);
            userAccountBtn.parentNode.replaceChild(newUserBtn, userAccountBtn);
            
            newUserBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('📱 User account button touched');
                
                // Close other dropdowns first
                closeAllDropdowns(newUserBtn);
                
                // Toggle user dropdown
                const userDropdown = document.getElementById('user-dropdown');
                if (userDropdown) {
                    userDropdown.classList.toggle('show');
                    this.vibrate('selection');
                }
            }, { passive: false });
            
            // Also support regular click for desktop
            newUserBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Don't toggle if already handled by touch
                if (this.touchState.lastTouchEnd && Date.now() - this.touchState.lastTouchEnd < 300) {
                    return;
                }
                
                closeAllDropdowns(newUserBtn);
                const userDropdown = document.getElementById('user-dropdown');
                userDropdown?.classList.toggle('show');
            });
        }
        
        // Tools Button - single tap toggle (only on mobile, desktop has hover)
        const toolsBtn = document.getElementById('tools-btn');
        if (toolsBtn) {
            const newToolsBtn = toolsBtn.cloneNode(true);
            toolsBtn.parentNode.replaceChild(newToolsBtn, toolsBtn);
            
            newToolsBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('📱 Tools button touched');
                
                closeAllDropdowns(newToolsBtn);
                
                const toolsDropdown = document.getElementById('tools-dropdown');
                if (toolsDropdown) {
                    toolsDropdown.classList.toggle('show');
                    this.vibrate('selection');
                }
            }, { passive: false });
            
            newToolsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.touchState.lastTouchEnd && Date.now() - this.touchState.lastTouchEnd < 300) {
                    return;
                }
                closeAllDropdowns(newToolsBtn);
                document.getElementById('tools-dropdown')?.classList.toggle('show');
            });
        }
        
        // Mode Switcher (Advanced/Beginner dropdown) - single tap toggle
        this.setupModeSwitcherTouch(closeAllDropdowns);
        
        // Global tap handler to close dropdowns when tapping outside
        document.addEventListener('touchstart', (e) => {
            // Don't close if tapping on a dropdown trigger or inside a dropdown
            const target = e.target;
            if (target.closest('.user-account') || 
                target.closest('.tools-menu') || 
                target.closest('.mode-switcher') ||
                target.closest('.user-dropdown') ||
                target.closest('.tools-dropdown') ||
                target.closest('.mode-dropdown')) {
                return;
            }
            
            closeAllDropdowns();
        }, { passive: true });
        
        // Also handle regular clicks for desktop
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.closest('.user-account') || 
                target.closest('.tools-menu') || 
                target.closest('.mode-switcher')) {
                return;
            }
            
            closeAllDropdowns();
        });
        
        console.log('📱 Mobile header dropdowns ready');
    }
    
    /**
     * Setup mode switcher for single-tap on mobile
     */
    setupModeSwitcherTouch(closeAllDropdowns) {
        const modeSwitcher = document.querySelector('.mode-switcher');
        if (!modeSwitcher) return;
        
        // Get all mode buttons
        const modeButtons = modeSwitcher.querySelectorAll('.mode-btn');
        
        modeButtons.forEach(btn => {
            // Clone to remove existing handlers
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('📱 Mode button touched:', newBtn.dataset.mode || 'active');
                
                // Close other dropdowns
                closeAllDropdowns(newBtn);
                
                // If this is the active button, toggle the dropdown
                if (newBtn.classList.contains('active')) {
                    this.toggleModeDropdown(newBtn);
                    this.vibrate('selection');
                } else {
                    // Switch to this mode
                    const mode = newBtn.dataset.mode;
                    if (mode && mode !== 'guided') {
                        this.setEditorMode(mode);
                        // vibrate happens in setEditorMode
                    } else if (mode === 'guided') {
                        this.showToast('Guided mode is not available on mobile', 'warning');
                    }
                }
            }, { passive: false });
            
            // Click handler for desktop fallback
            newBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Skip if touch was recently handled
                if (this.touchState.lastTouchEnd && Date.now() - this.touchState.lastTouchEnd < 300) {
                    return;
                }
                
                if (newBtn.classList.contains('active')) {
                    this.toggleModeDropdown(newBtn);
                } else {
                    const mode = newBtn.dataset.mode;
                    if (mode && mode !== 'guided') {
                        this.setEditorMode(mode);
                    }
                }
            });
        });
    }
    
    /**
     * Global touch start handler - comprehensive tracking
     */
    handleGlobalTouchStart(e) {
        const tracker = this.touchTracker;
        const touch = e.touches[0];
        
        // Clear any pending long press timer
        if (this._longPressTimer) {
            clearTimeout(this._longPressTimer);
            this._longPressTimer = null;
        }
        
        // Reset tracker state
        tracker.reset();
        
        // Set tracking state
        tracker.isTracking = true;
        tracker.isTouching = true;
        tracker.touchCount = e.touches.length;
        tracker.startTime = Date.now();
        tracker.lastMoveTime = tracker.startTime;
        
        // Record position
        if (touch) {
            tracker.startX = touch.clientX;
            tracker.startY = touch.clientY;
            tracker.currentX = touch.clientX;
            tracker.currentY = touch.clientY;
        }
        
        // Record targets
        tracker.startTarget = e.target;
        tracker.currentTarget = e.target;
        
        // Find interactive target
        const interactiveTarget = e.target.closest(
            'button, .btn, a, [role="button"], .clickable, .mobile-nav-item, ' +
            '.fab-main, .fab-menu-item, .icon-btn, .modal-close, .btn-close, ' +
            '[data-action], .action-card, .file-item, .pack-item, .tree-item'
        );
        tracker.interactiveTarget = interactiveTarget;
        
        // Multi-touch / pinch detection
        if (e.touches.length === 2) {
            tracker.isPinching = true;
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            tracker.initialPinchDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
        }
        
        // Check for double-tap
        const timeSinceLastTap = tracker.startTime - tracker.lastTapTime;
        const isDoubleTap = timeSinceLastTap < tracker.config.doubleTapDelay;
        
        // Skip visual feedback for elements with their own handling
        if (interactiveTarget?.classList.contains('user-account-btn') || 
            interactiveTarget?.classList.contains('mode-btn') ||
            interactiveTarget?.id === 'tools-btn' ||
            interactiveTarget?.id === 'mobile-close-yaml' ||
            interactiveTarget?.id === 'mobile-header-more-btn' ||
            interactiveTarget?.closest('.mode-switcher')) {
            console.log('📱 Touch START (delegated handler):', interactiveTarget?.id || interactiveTarget?.className);
            return;
        }
        
        // Visual feedback for interactive elements
        if (interactiveTarget) {
            console.log('📱 Touch START:', interactiveTarget.id || interactiveTarget.className || interactiveTarget.tagName);
            interactiveTarget.classList.add('touch-active');
            interactiveTarget.style.transform = 'scale(0.97)';
            interactiveTarget.style.opacity = '0.9';
        }
        
        // Setup long press detection
        if (interactiveTarget) {
            this._longPressTimer = setTimeout(() => {
                if (tracker.isTouching && !tracker.isScrolling) {
                    tracker.isLongPress = true;
                    tracker.gesture.type = 'long-press';
                    tracker.gesture.detected = true;
                    this.vibrate('heavy');
                    console.log('📱 Long press detected on:', interactiveTarget.id || interactiveTarget.className);
                    
                    // Dispatch custom event
                    interactiveTarget.dispatchEvent(new CustomEvent('longpress', {
                        bubbles: true,
                        detail: { tracker }
                    }));
                    
                    // Call callback if set
                    if (tracker.onGesture) {
                        tracker.onGesture('long-press', tracker);
                    }
                }
            }, tracker.config.longPressDelay);
        }
        
        // Call callback if set
        if (tracker.onTouchStart) {
            tracker.onTouchStart(e, tracker);
        }
    }
    
    /**
     * Global touch move handler - comprehensive tracking
     */
    handleGlobalTouchMove(e) {
        const tracker = this.touchTracker;
        if (!tracker.isTracking) return;
        
        const touch = e.touches[0];
        if (!touch) return;
        
        const now = Date.now();
        const timeDelta = now - tracker.lastMoveTime;
        
        // Update current position
        const prevX = tracker.currentX;
        const prevY = tracker.currentY;
        tracker.currentX = touch.clientX;
        tracker.currentY = touch.clientY;
        
        // Calculate delta from start
        tracker.deltaX = tracker.currentX - tracker.startX;
        tracker.deltaY = tracker.currentY - tracker.startY;
        
        // Calculate velocity (px/ms)
        if (timeDelta > 0) {
            tracker.velocityX = (tracker.currentX - prevX) / timeDelta;
            tracker.velocityY = (tracker.currentY - prevY) / timeDelta;
        }
        tracker.lastMoveTime = now;
        
        // Update current target
        tracker.currentTarget = document.elementFromPoint(touch.clientX, touch.clientY);
        
        // Multi-touch / pinch tracking
        if (e.touches.length === 2 && tracker.isPinching) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            tracker.currentPinchDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            tracker.pinchScale = tracker.currentPinchDistance / tracker.initialPinchDistance;
        }
        
        // Detect scroll gesture
        const totalDelta = Math.sqrt(tracker.deltaX ** 2 + tracker.deltaY ** 2);
        if (totalDelta > tracker.config.scrollThreshold && !tracker.isScrolling) {
            tracker.isScrolling = true;
            tracker.gesture.type = 'scroll';
            
            // Cancel long press
            if (this._longPressTimer) {
                clearTimeout(this._longPressTimer);
                this._longPressTimer = null;
            }
            
            // Reset visual feedback on interactive element
            if (tracker.interactiveTarget) {
                tracker.interactiveTarget.classList.remove('touch-active');
                tracker.interactiveTarget.style.transform = '';
                tracker.interactiveTarget.style.opacity = '';
            }
            
            console.log('📱 Scrolling detected, delta:', totalDelta.toFixed(1) + 'px');
            
            // Call scroll callback
            if (tracker.onScroll) {
                tracker.onScroll(tracker);
            }
        }
        
        // Call callback if set
        if (tracker.onTouchMove) {
            tracker.onTouchMove(e, tracker);
        }
    }
    
    /**
     * Global touch end handler - comprehensive tracking
     */
    handleGlobalTouchEnd(e) {
        const tracker = this.touchTracker;
        
        // Clear long press timer
        if (this._longPressTimer) {
            clearTimeout(this._longPressTimer);
            this._longPressTimer = null;
        }
        
        // Calculate final values
        tracker.isTouching = false;
        tracker.touchDuration = Date.now() - tracker.startTime;
        tracker.lastTouchEnd = Date.now();
        
        const interactiveTarget = tracker.interactiveTarget;
        
        // Reset visual state
        if (interactiveTarget) {
            interactiveTarget.classList.remove('touch-active');
            interactiveTarget.style.transform = '';
            interactiveTarget.style.opacity = '';
        }
        
        // Determine gesture type
        if (!tracker.gesture.detected) {
            if (tracker.isScrolling) {
                // Check if it was a swipe
                if (tracker.isSwipe()) {
                    const direction = tracker.getSwipeDirection();
                    tracker.gesture.type = `swipe-${direction}`;
                    tracker.gesture.direction = direction;
                    tracker.gesture.distance = Math.sqrt(tracker.deltaX ** 2 + tracker.deltaY ** 2);
                    tracker.gesture.velocity = Math.sqrt(tracker.velocityX ** 2 + tracker.velocityY ** 2);
                    tracker.gesture.detected = true;
                    console.log('📱 Swipe detected:', direction, 'distance:', tracker.gesture.distance.toFixed(0) + 'px');
                } else {
                    tracker.gesture.type = 'scroll';
                }
            } else if (tracker.isPinching) {
                tracker.gesture.type = 'pinch';
                tracker.gesture.detected = true;
                console.log('📱 Pinch detected, scale:', tracker.pinchScale.toFixed(2));
            } else if (tracker.isValidTap()) {
                // Check for double-tap
                const timeSinceLastTap = tracker.startTime - tracker.lastTapTime;
                if (timeSinceLastTap < tracker.config.doubleTapDelay && timeSinceLastTap > 50) {
                    tracker.gesture.type = 'double-tap';
                    tracker.gesture.detected = true;
                    console.log('📱 Double-tap detected');
                } else {
                    tracker.gesture.type = 'tap';
                    tracker.gesture.detected = true;
                }
                tracker.lastTapTime = tracker.startTime;
            }
        }
        
        // Log gesture result
        console.log('📱 Touch END:', 
            interactiveTarget?.id || interactiveTarget?.className || 'no-target',
            'gesture:', tracker.gesture.type,
            'duration:', tracker.touchDuration + 'ms',
            'scrolling:', tracker.isScrolling
        );
        
        // Only trigger click if it was a valid tap on an interactive element
        if (tracker.gesture.type === 'tap' && interactiveTarget && !tracker.isLongPress) {
            // Skip elements with their own handlers
            if (interactiveTarget?.classList.contains('user-account-btn') || 
                interactiveTarget?.classList.contains('mode-btn') ||
                interactiveTarget?.id === 'tools-btn' ||
                interactiveTarget?.id === 'mobile-close-yaml' ||
                interactiveTarget?.id === 'mobile-header-more-btn' ||
                interactiveTarget?.closest('.mode-switcher')) {
                // These have their own touch handlers
                return;
            }
            
            // Haptic feedback
            this.vibrate('selection');
            
            // Prevent default and dispatch click
            e.preventDefault();
            
            console.log('📱 Dispatching click to:', interactiveTarget.id || interactiveTarget.className);
            
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            clickEvent._fromTouch = true;
            clickEvent._touchTracker = tracker;
            interactiveTarget.dispatchEvent(clickEvent);
        }
        
        // Call gesture callback
        if (tracker.onGesture && tracker.gesture.detected) {
            tracker.onGesture(tracker.gesture.type, tracker);
        }
        
        // Call touch end callback
        if (tracker.onTouchEnd) {
            tracker.onTouchEnd(e, tracker);
        }
        
        // Reset some state (keep lastTouchEnd and lastTapTime)
        tracker.isTracking = false;
        tracker.interactiveTarget = null;
    }
    
    /**
     * Global touch cancel handler
     */
    handleGlobalTouchCancel(e) {
        console.log('📱 Touch CANCEL');
        
        // Clear long press timer
        if (this._longPressTimer) {
            clearTimeout(this._longPressTimer);
            this._longPressTimer = null;
        }
        
        const tracker = this.touchTracker;
        
        // Reset visual state
        if (tracker.interactiveTarget) {
            tracker.interactiveTarget.classList.remove('touch-active');
            tracker.interactiveTarget.style.transform = '';
            tracker.interactiveTarget.style.opacity = '';
        }
        
        tracker.reset();
        tracker.lastTouchEnd = Date.now();
    }
    
    /**
     * Global scroll handler
     */
    handleGlobalScroll(e) {
        const tracker = this.touchTracker;
        
        // If we're touching while scrolling, mark as scrolling
        if (tracker.isTouching && !tracker.isScrolling) {
            tracker.isScrolling = true;
            tracker.gesture.type = 'scroll';
            
            // Reset visual feedback
            if (tracker.interactiveTarget) {
                tracker.interactiveTarget.classList.remove('touch-active');
                tracker.interactiveTarget.style.transform = '';
                tracker.interactiveTarget.style.opacity = '';
            }
            
            // Cancel long press
            if (this._longPressTimer) {
                clearTimeout(this._longPressTimer);
                this._longPressTimer = null;
            }
        }
    }
    
    /**
     * Global click handler - prevents double-firing after touch
     */
    handleGlobalClick(e) {
        const tracker = this.touchTracker;
        
        // If this click came from our touch handler, let it through
        if (e._fromTouch) {
            console.log('📱 Click from touch - allowing:', e.target.id || e.target.className);
            return;
        }
        
        // Block clicks that happen too soon after a touch (prevents ghost clicks)
        if (tracker.shouldBlockClick()) {
            console.log('📱 Blocking ghost click (too soon after touch):', e.target.id || e.target.className);
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // Log native clicks for debugging
        const target = e.target.closest('button, .btn, .icon-btn, .modal-close, .btn-close, .action-card');
        if (target) {
            console.log('📱 Native click on:', target.id || target.className);
        }
    }
    
    /**
     * Make a specific element touch-friendly
     * Use this for dynamically added elements or custom handlers
     */
    makeTouchFriendly(element, handler) {
        if (!element || !this.isTouchDevice) return;
        
        let touchHandled = false;
        
        // Touch handler
        element.addEventListener('touchend', (e) => {
            e.preventDefault();
            touchHandled = true;
            
            // Visual feedback
            element.style.transform = 'scale(0.96)';
            element.style.opacity = '0.85';
            
            setTimeout(() => {
                element.style.transform = '';
                element.style.opacity = '';
            }, 100);
            
            // Haptic
            this.vibrate('selection');
            
            // Execute handler
            if (handler) handler(e);
            
            // Reset after delay
            setTimeout(() => { touchHandled = false; }, 300);
        }, { passive: false });
        
        // Block click if touch was handled
        element.addEventListener('click', (e) => {
            if (touchHandled) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
        // Remove title
        if (element.hasAttribute('title')) {
            element.dataset.originalTitle = element.getAttribute('title');
            element.removeAttribute('title');
        }
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
     * Detect device type based on screen width, user agent, and touch capability
     */
    detectDeviceType() {
        const width = window.innerWidth;
        const userAgent = navigator.userAgent.toLowerCase();
        
        // Check user agent for mobile devices (expanded patterns)
        const isMobileUA = /android|webos|iphone|ipod|blackberry|iemobile|opera mini|mobile|phone/i.test(userAgent);
        
        // Check user agent for tablet devices (expanded patterns)
        const isTabletUA = /ipad|tablet|playbook|silk|kindle|surface/i.test(userAgent) || 
                          (userAgent.includes('android') && !userAgent.includes('mobile')) ||
                          (userAgent.includes('macintosh') && 'ontouchend' in document);  // iPad with desktop Safari
        
        // Check for touch capability (another signal for mobile/tablet)
        const hasTouch = this.detectTouchSupport();
        
        // CSS media query check for coarse pointer (touchscreen)
        const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches || false;
        
        // CSS media query check for hover capability (desktop usually has this)
        const canHover = window.matchMedia?.('(hover: hover)')?.matches || false;
        
        // Determine device type with multiple signals
        // Mobile: small screen OR mobile UA
        if (isMobileUA || width < this.breakpoints.mobile) {
            return 'mobile';
        }
        
        // Tablet: tablet UA OR (medium screen with touch/coarse pointer and no hover)
        if (isTabletUA) {
            return 'tablet';
        }
        
        // Medium-sized touch device without hover = probably tablet
        if (width >= this.breakpoints.mobile && width < this.breakpoints.tablet) {
            if (hasTouch || hasCoarsePointer) {
                return 'tablet';
            }
            // Medium screen but has hover = could be small laptop, treat as tablet for safety
            return 'tablet';
        }
        
        // Large screen with touch but no hover = probably large tablet (like iPad Pro)
        if (width >= this.breakpoints.tablet && (hasTouch || hasCoarsePointer) && !canHover) {
            return 'tablet';
        }
        
        return 'desktop';
    }
    
    /**
     * Detect touch support
     */
    detectTouchSupport() {
        return 'ontouchstart' in window || 
               'ontouchend' in document ||
               navigator.maxTouchPoints > 0 || 
               navigator.msMaxTouchPoints > 0 ||
               window.matchMedia?.('(pointer: coarse)')?.matches || false;
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
        
        // Mode dropdown setup is now handled by setupModeSwitcherTouch() in setupMobileHeaderDropdowns()
        // We only need to set the attribute for identification
        const activeBtn = document.querySelector('.mode-switcher .mode-btn.active');
        if (activeBtn) {
            activeBtn.setAttribute('data-mode-dropdown', 'true');
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
                    <button class="icon-btn" id="mobile-close-yaml">
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
        
        // Setup event listeners - use touchstart for instant response on mobile
        let touchHandled = false;
        
        // Primary: touchstart handler for instant mobile response (like profile button)
        moreBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('📱 More button touched (touchstart)');
            touchHandled = true;
            this.toggleMobileHeaderDropdown(); // This already calls vibrate
            
            // Reset flag after a short delay
            setTimeout(() => { touchHandled = false; }, 300);
        }, { passive: false });
        
        // Fallback: click handler for desktop/accessibility
        moreBtn.addEventListener('click', (e) => {
            if (touchHandled) {
                console.log('📱 More button click skipped (touch handled)');
                return;
            }
            
            e.stopPropagation();
            e.preventDefault();
            this.toggleMobileHeaderDropdown();
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
        
        // Mobile copy YAML - use makeTouchFriendly for consistent handling
        const copyYamlBtn = document.getElementById('mobile-copy-yaml');
        if (copyYamlBtn) {
            this.makeTouchFriendly(copyYamlBtn, () => this.copyYAMLToClipboard());
        }
        
        // Mobile export YAML
        const exportYamlBtn = document.getElementById('mobile-export-yaml');
        if (exportYamlBtn) {
            this.makeTouchFriendly(exportYamlBtn, () => this.getEditor()?.exportYAML());
        }
        
        // Mobile close YAML button - direct handler with debugging
        const closeYamlBtn = document.getElementById('mobile-close-yaml');
        if (closeYamlBtn) {
            console.log('📱 Setting up close YAML button handler');
            
            // Remove any existing handlers first
            const newCloseBtn = closeYamlBtn.cloneNode(true);
            closeYamlBtn.parentNode.replaceChild(newCloseBtn, closeYamlBtn);
            
            // Track if we've handled this touch to prevent double-firing
            let touchHandled = false;
            
            // Primary: touchend handler for mobile (fires first)
            newCloseBtn.addEventListener('touchend', (e) => {
                console.log('📱 Close YAML button TOUCHEND!');
                e.preventDefault();
                e.stopPropagation();
                
                if (touchHandled) {
                    console.log('📱 Touch already handled, skipping');
                    return;
                }
                
                touchHandled = true;
                this.closeYAMLSheet(); // This already calls updateNavActiveState
                this.vibrate('selection');
                
                // Reset flag after a short delay
                setTimeout(() => { touchHandled = false; }, 300);
            }, { passive: false });
            
            // Fallback: click handler for desktop/accessibility
            newCloseBtn.addEventListener('click', (e) => {
                // Skip if already handled by touch
                if (touchHandled) {
                    console.log('📱 Close YAML button click skipped (touch handled)');
                    return;
                }
                
                console.log('📱 Close YAML button CLICKED!');
                e.preventDefault();
                e.stopPropagation();
                
                this.closeYAMLSheet(); // This already calls updateNavActiveState
            });
        }
    }
    
    /**
     * Update bottom nav active state
     */
    updateNavActiveState(panel) {
        console.log('📱 Updating nav active state to:', panel);
        this.dom.bottomNav?.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.panel === panel);
        });
        this.state.activePanel = panel;
    }
    
    /**
     * Handle bottom navigation click
     */
    handleNavClick(e) {
        const panel = e.currentTarget.dataset.panel;
        const currentItem = e.currentTarget;
        
        console.log('📱 Nav click:', panel);
        
        // Special handling for YAML toggle - clicking again closes it
        if (panel === 'yaml') {
            const isCurrentlyActive = currentItem.classList.contains('active');
            console.log('📱 YAML nav clicked, currently active:', isCurrentlyActive, 'sheet open:', this.state.yamlSheetOpen);
            
            if (isCurrentlyActive && this.state.yamlSheetOpen) {
                // Close YAML and deactivate
                this.closeYAMLSheet();
                return;
            }
        }
        
        // Handle panel navigation
        switch (panel) {
            case 'home':
                this.closeYAMLSheet(); // Close YAML when going home
                this.updateNavActiveState('home');
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
        if (!this.dom.yamlSheet) {
            console.log('📱 toggleYAMLSheet: No yamlSheet found!');
            return;
        }
        
        const isOpen = this.dom.yamlSheet.classList.contains('open');
        console.log('📱 Toggle YAML sheet, currently open:', isOpen);
        
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
        
        console.log('📱 Opening YAML sheet');
        
        // Sync content from desktop preview
        const desktopPreview = document.getElementById('yaml-preview-content');
        const mobileContent = document.getElementById('mobile-yaml-content');
        
        if (desktopPreview && mobileContent) {
            mobileContent.innerHTML = `<pre><code>${desktopPreview.textContent}</code></pre>`;
        }
        
        this.dom.yamlSheet.classList.add('open');
        this.dom.yamlSheet.style.height = `${this.state.yamlSheetHeight * 100}%`;
        this.state.yamlSheetOpen = true;
        
        // Update nav active state to YAML
        this.updateNavActiveState('yaml');
    }
    
    /**
     * Close YAML bottom sheet
     */
    closeYAMLSheet() {
        if (!this.dom.yamlSheet) return;
        
        // Prevent multiple close calls
        if (!this.state.yamlSheetOpen) {
            console.log('📱 YAML sheet already closed, skipping');
            return;
        }
        
        console.log('📱 Closing YAML sheet');
        
        this.dom.yamlSheet.classList.remove('open');
        
        // CRITICAL: Reset inline height so CSS can take over
        this.dom.yamlSheet.style.height = '';
        
        this.state.yamlSheetOpen = false;
        
        // Update nav active state to home
        this.updateNavActiveState('home');
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
                    
                    // Update convenience properties to match new device type
                    this.isMobile = newDeviceType === 'mobile';
                    this.isTablet = newDeviceType === 'tablet';
                    this.isDesktop = newDeviceType === 'desktop';
                    
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
        
        // Wrap in try-catch to handle Chrome's intervention silently
        try {
            navigator.vibrate(pattern);
        } catch (e) {
            // Vibration blocked by browser - this is fine, just ignore
        }
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
    
    // Aliases for compatibility
    showToast(message, type = 'info') {
        this.showNotification(message, type);
    }
    
    /**
     * Setup swipeable toast notifications for mobile
     * Toasts can be swiped right to dismiss
     */
    setupSwipeableToasts() {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            console.warn('📱 Toast container not found for swipeable setup');
            return;
        }
        
        console.log('📱 Setting up swipeable toasts...');
        
        // Observe for new toasts being added
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList?.contains('toast')) {
                        this.makeToastSwipeable(node);
                    }
                });
            });
        });
        
        observer.observe(toastContainer, { childList: true });
        
        // Make existing toasts swipeable
        toastContainer.querySelectorAll('.toast').forEach(toast => {
            this.makeToastSwipeable(toast);
        });
    }
    
    /**
     * Make a single toast swipeable
     */
    makeToastSwipeable(toast) {
        if (toast.dataset.swipeEnabled) return;
        toast.dataset.swipeEnabled = 'true';
        
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        const handleTouchStart = (e) => {
            startX = e.touches[0].clientX;
            currentX = startX;
            isDragging = true;
            toast.classList.add('swiping');
        };
        
        const handleTouchMove = (e) => {
            if (!isDragging) return;
            
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;
            
            // Only allow swipe right (positive direction)
            if (deltaX > 0) {
                // Add resistance at the end
                const resistance = Math.min(deltaX, 200);
                const dampened = resistance * (1 - resistance / 400);
                toast.style.transform = `translateX(${dampened}px)`;
                toast.style.opacity = Math.max(0, 1 - deltaX / 150);
            }
        };
        
        const handleTouchEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            toast.classList.remove('swiping');
            
            const deltaX = currentX - startX;
            
            // Dismiss if swiped more than 80px
            if (deltaX > 80) {
                toast.classList.add('dismissed');
                this.vibrate('light');
                
                // Remove after animation
                setTimeout(() => {
                    toast.remove();
                }, 300);
            } else {
                // Snap back
                toast.style.transform = '';
                toast.style.opacity = '';
            }
        };
        
        toast.addEventListener('touchstart', handleTouchStart, { passive: true });
        toast.addEventListener('touchmove', handleTouchMove, { passive: true });
        toast.addEventListener('touchend', handleTouchEnd);
        toast.addEventListener('touchcancel', handleTouchEnd);
    }
    
    // Haptic feedback aliases (for consistency across codebase)
    hapticFeedback(pattern) {
        this.vibrate(pattern);
    }
    
    triggerHaptic(pattern) {
        this.vibrate(pattern);
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
     * Requires deliberate pull-and-hold gesture to prevent accidental triggers
     */
    initPullToRefresh() {
        if (!this.isMobile || !this.state.pullToRefreshEnabled) return;
        
        let startY = 0;
        let pulling = false;
        let indicator = null;
        let holdTimer = null;
        let isReady = false;
        const PULL_THRESHOLD = 120; // Increased threshold
        const HOLD_TIME = 300; // Must hold for 300ms after reaching threshold
        
        const createIndicator = () => {
            if (indicator) return indicator;
            indicator = document.createElement('div');
            indicator.className = 'pull-refresh-indicator';
            indicator.innerHTML = '<i class="fas fa-sync-alt"></i> Pull down to refresh';
            document.body.appendChild(indicator);
            return indicator;
        };
        
        const resetState = () => {
            pulling = false;
            startY = 0;
            isReady = false;
            if (holdTimer) {
                clearTimeout(holdTimer);
                holdTimer = null;
            }
            if (indicator) {
                indicator.style.transform = 'translateX(-50%) translateY(-100%)';
                indicator.style.opacity = '0';
                indicator.classList.remove('ready');
            }
        };
        
        document.addEventListener('touchstart', (e) => {
            // Only enable at absolute top of page and not in modals/editors with scroll
            const target = e.target;
            const isInScrollable = target.closest('.modal-body, .editor-content, .sidebar-content, .yaml-preview, .form-textarea, [contenteditable]');
            
            if (window.scrollY === 0 && !this.state.keyboardOpen && !isInScrollable) {
                startY = e.touches[0].clientY;
                pulling = true;
                isReady = false;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!pulling) return;
            
            const currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            
            // Only trigger if pulling down significantly AND at top of page
            if (diff > 30 && window.scrollY === 0) {
                const ind = createIndicator();
                const progress = Math.min(diff / PULL_THRESHOLD, 1);
                ind.style.transform = `translateX(-50%) translateY(${Math.min(diff * 0.4, 60)}px)`;
                ind.style.opacity = progress;
                
                if (diff > PULL_THRESHOLD) {
                    if (!holdTimer && !isReady) {
                        // Start hold timer - user must hold for HOLD_TIME ms
                        ind.innerHTML = '<i class="fas fa-sync-alt"></i> Hold to refresh...';
                        holdTimer = setTimeout(() => {
                            isReady = true;
                            ind.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Release to refresh';
                            ind.classList.add('ready');
                            // Haptic feedback when ready
                            if (navigator.vibrate) navigator.vibrate(50);
                        }, HOLD_TIME);
                    }
                } else {
                    // User pulled back up, cancel
                    if (holdTimer) {
                        clearTimeout(holdTimer);
                        holdTimer = null;
                    }
                    isReady = false;
                    ind.innerHTML = '<i class="fas fa-sync-alt"></i> Pull down to refresh';
                    ind.classList.remove('ready');
                }
            } else if (diff < 0) {
                // User is scrolling up normally, cancel pull-to-refresh
                resetState();
            }
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            if (indicator && isReady) {
                indicator.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';
                indicator.classList.add('visible');
                
                // Trigger refresh
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                resetState();
            }
            
            pulling = false;
            startY = 0;
            if (holdTimer) {
                clearTimeout(holdTimer);
                holdTimer = null;
            }
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
                // Check if the label contains the input (would cause HierarchyRequestError)
                // This happens with structures like <label><input/></label>
                const labelContainsInput = label.contains(input);
                
                if (!labelContainsInput) {
                    group.classList.add('floating-label-group');
                    
                    // Move label after input for CSS targeting
                    if (input.nextElementSibling !== label) {
                        try {
                            input.after(label);
                        } catch (err) {
                            // Silently ignore DOM manipulation errors
                            console.debug('📱 Could not move label:', err.message);
                        }
                    }
                    
                    // Add placeholder if missing
                    if (!input.placeholder) {
                        input.placeholder = ' ';
                    }
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
        
        // NEW: Ultra-compact UI features
        this.initCollapsibleFilters();
        this.initAutoHidingHeaders();
        this.initMobileActionOverflow();
        this.initSwipeToRevealActions();
        this.simplifyModalsForMobile();
        
        // NEW: Create floating editor action bar FIRST (before view tracking needs it)
        this.initEditorActionBar();
        
        // NEW: Track current view for header hiding (after action bar exists)
        this.initViewTracking();
        
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
    
    /**
     * Initialize collapsible filter panels
     * Adds toggle buttons to hide/show filter toolbars
     */
    initCollapsibleFilters() {
        // Template Selector filters
        const templateToolbar = document.querySelector('#templateSelectorOverlay .template-toolbar');
        if (templateToolbar && !templateToolbar.dataset.mobileInit) {
            templateToolbar.dataset.mobileInit = 'true';
            this.createFilterToggle(templateToolbar, 'templateSelectorOverlay');
        }
        
        // Watch for dynamic modal creation
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        // Check for template selector
                        const toolbar = node.querySelector?.('.template-toolbar');
                        if (toolbar && !toolbar.dataset.mobileInit) {
                            toolbar.dataset.mobileInit = 'true';
                            this.createFilterToggle(toolbar, 'dynamic');
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    /**
     * Create a filter toggle button for a toolbar
     */
    createFilterToggle(toolbar, containerId) {
        const container = toolbar.parentElement;
        if (!container) return;
        
        // Create toggle button
        const toggle = document.createElement('button');
        toggle.className = 'mobile-filter-toggle';
        toggle.innerHTML = `
            <i class="fas fa-sliders-h"></i>
            <span>Filters & Sort</span>
            <span class="filter-count" style="display: none;">0</span>
            <i class="fas fa-chevron-down" style="margin-left: auto; opacity: 0.6; font-size: 0.75rem;"></i>
        `;
        
        // Insert before toolbar
        container.insertBefore(toggle, toolbar);
        
        // Toggle handler
        toggle.addEventListener('click', () => {
            const isExpanded = toolbar.classList.toggle('mobile-expanded');
            toggle.querySelector('.fa-chevron-down').style.transform = isExpanded ? 'rotate(180deg)' : '';
            this.hapticFeedback('selection');
        });
        
        // Update filter count when filters change
        this.updateFilterCount(toolbar, toggle);
        toolbar.addEventListener('change', () => this.updateFilterCount(toolbar, toggle));
    }
    
    /**
     * Update the active filter count display
     */
    updateFilterCount(toolbar, toggle) {
        const selects = toolbar.querySelectorAll('select');
        let activeCount = 0;
        
        selects.forEach(select => {
            if (select.value && select.value !== 'all' && select.value !== 'name') {
                activeCount++;
            }
        });
        
        const countBadge = toggle.querySelector('.filter-count');
        if (countBadge) {
            if (activeCount > 0) {
                countBadge.textContent = activeCount;
                countBadge.style.display = 'inline-block';
            } else {
                countBadge.style.display = 'none';
            }
        }
    }
    
    /**
     * Initialize auto-hiding headers on scroll
     */
    initAutoHidingHeaders() {
        let lastScrollY = 0;
        let ticking = false;
        
        const updateHeaders = () => {
            const scrollY = window.scrollY;
            const delta = scrollY - lastScrollY;
            
            // Get all sticky headers in editors
            const headers = document.querySelectorAll('.editor-header');
            
            headers.forEach(header => {
                if (delta > 10 && scrollY > 100) {
                    // Scrolling down - hide header
                    header.classList.add('header-hidden');
                } else if (delta < -10) {
                    // Scrolling up - show header
                    header.classList.remove('header-hidden');
                }
            });
            
            lastScrollY = scrollY;
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateHeaders);
                ticking = true;
            }
        }, { passive: true });
        
        // Also handle scrollable containers
        document.querySelectorAll('.view-container, .editor-content, .modal-body').forEach(container => {
            let containerLastScroll = 0;
            
            container.addEventListener('scroll', () => {
                const scrollTop = container.scrollTop;
                const delta = scrollTop - containerLastScroll;
                
                const header = container.querySelector('.editor-header') || 
                               container.previousElementSibling?.classList?.contains('editor-header') 
                               ? container.previousElementSibling : null;
                
                if (header) {
                    if (delta > 10 && scrollTop > 50) {
                        header.classList.add('header-hidden');
                    } else if (delta < -10) {
                        header.classList.remove('header-hidden');
                    }
                }
                
                containerLastScroll = scrollTop;
            }, { passive: true });
        });
    }
    
    /**
     * Initialize mobile action overflow menu
     * Converts multiple action buttons to a "more" menu
     */
    initMobileActionOverflow() {
        // Find all action containers with more than 3 buttons
        document.querySelectorAll('.editor-actions, .editor-header .action-group').forEach(container => {
            const buttons = container.querySelectorAll('.btn');
            
            if (buttons.length > 3 && !container.dataset.mobileOverflow) {
                container.dataset.mobileOverflow = 'true';
                
                // Create overflow button
                const moreBtn = document.createElement('button');
                moreBtn.className = 'btn btn-secondary btn-icon mobile-more-btn';
                moreBtn.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
                moreBtn.title = 'More actions';
                container.appendChild(moreBtn);
                
                // Create overflow menu
                const overflowMenu = document.createElement('div');
                overflowMenu.className = 'mobile-overflow-menu';
                overflowMenu.style.cssText = `
                    display: none;
                    position: fixed;
                    bottom: calc(var(--mobile-nav-height, 64px) + env(safe-area-inset-bottom, 0px));
                    left: 0;
                    right: 0;
                    background: var(--bg-secondary, #1a1d2e);
                    border-top: 1px solid var(--border-color, #2a2d3e);
                    padding: 12px;
                    z-index: 1000;
                    box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
                    animation: slideUpSheet 0.25s ease;
                `;
                
                // Clone buttons 4+ into overflow
                buttons.forEach((btn, index) => {
                    if (index >= 3) {
                        const clone = btn.cloneNode(true);
                        clone.style.cssText = `
                            width: 100%;
                            justify-content: flex-start;
                            margin-bottom: 8px;
                            min-height: 44px;
                        `;
                        // Show text for cloned buttons
                        const icon = clone.querySelector('i');
                        if (icon && !clone.textContent.trim().replace(icon.textContent, '')) {
                            const label = btn.title || btn.getAttribute('aria-label') || 'Action';
                            const span = document.createElement('span');
                            span.textContent = label;
                            span.style.marginLeft = '8px';
                            clone.appendChild(span);
                        }
                        overflowMenu.appendChild(clone);
                        
                        // Copy click handler
                        clone.addEventListener('click', (e) => {
                            e.stopPropagation();
                            btn.click();
                            overflowMenu.style.display = 'none';
                        });
                    }
                });
                
                document.body.appendChild(overflowMenu);
                
                // Toggle handler
                moreBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isOpen = overflowMenu.style.display === 'block';
                    overflowMenu.style.display = isOpen ? 'none' : 'block';
                    this.hapticFeedback('selection');
                });
                
                // Close on outside click
                document.addEventListener('click', () => {
                    overflowMenu.style.display = 'none';
                });
            }
        });
    }
    
    /**
     * Initialize swipe-to-reveal actions on list items
     */
    initSwipeToRevealActions() {
        const initSwipe = (item) => {
            if (item.dataset.swipeInit) return;
            item.dataset.swipeInit = 'true';
            
            let startX = 0;
            let currentX = 0;
            let isDragging = false;
            
            const content = item.querySelector('.swipe-content') || item;
            const actions = item.querySelector('.swipe-actions');
            if (!actions) return;
            
            const maxSwipe = actions.offsetWidth || 120;
            
            item.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isDragging = true;
                content.style.transition = 'none';
            }, { passive: true });
            
            item.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                currentX = e.touches[0].clientX;
                const diffX = startX - currentX;
                
                if (diffX > 0 && diffX < maxSwipe) {
                    content.style.transform = `translateX(-${diffX}px)`;
                }
            }, { passive: true });
            
            item.addEventListener('touchend', () => {
                isDragging = false;
                content.style.transition = 'transform 0.2s ease';
                
                const diffX = startX - currentX;
                if (diffX > maxSwipe / 2) {
                    // Reveal actions
                    content.style.transform = `translateX(-${maxSwipe}px)`;
                    this.hapticFeedback('selection');
                } else {
                    // Snap back
                    content.style.transform = 'translateX(0)';
                }
            });
            
            // Tap elsewhere to close
            document.addEventListener('touchstart', (e) => {
                if (!item.contains(e.target)) {
                    content.style.transform = 'translateX(0)';
                }
            }, { passive: true });
        };
        
        // Init existing items
        document.querySelectorAll('.swipe-container, .skill-line-item, .skill-item').forEach(initSwipe);
        
        // Watch for new items
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.classList?.contains('swipe-container') || 
                            node.classList?.contains('skill-line-item')) {
                            initSwipe(node);
                        }
                        node.querySelectorAll?.('.swipe-container, .skill-line-item').forEach(initSwipe);
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    /**
     * Simplify modals for mobile
     * Removes unnecessary elements and optimizes layout
     */
    simplifyModalsForMobile() {
        // Hide comparison panels by default
        const comparisonPanels = document.querySelectorAll('#comparisonPanel');
        comparisonPanels.forEach(panel => {
            panel.style.display = 'none';
        });
        
        // Hide template card footers/stats for space
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        // Auto-hide excessive content in templates
                        const cards = node.querySelectorAll?.('.template-grid-card, .template-list-card');
                        cards?.forEach(card => {
                            const footer = card.querySelector('.template-card-footer');
                            const stats = card.querySelector('.template-card-stats');
                            if (footer) footer.style.display = 'none';
                            if (stats) stats.style.display = 'none';
                        });
                        
                        // Hide tooltips/tips in modals
                        const tips = node.querySelectorAll?.('.alert-info, .quick-tips, .modal-tips');
                        tips?.forEach(tip => {
                            if (tip.closest('.modal') || tip.closest('.condition-modal')) {
                                tip.style.display = 'none';
                            }
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    /**
     * Track current view for conditional styling (hide header in editors)
     */
    initViewTracking() {
        // Debounce timer to prevent excessive calls
        let debounceTimer = null;
        
        const updateCurrentView = (viewName = null) => {
            let currentView = viewName || 'home';
            
            // If no viewName provided, find visible view
            if (!viewName) {
                const views = document.querySelectorAll('.view-container.active, [id$="-view"].active');
                views.forEach(view => {
                    const id = view.id || '';
                    if (id.includes('mob-editor')) currentView = 'mob-editor';
                    else if (id.includes('skill-editor')) currentView = 'skill-editor';
                    else if (id.includes('item-editor')) currentView = 'item-editor';
                    else if (id.includes('droptable-editor')) currentView = 'droptable-editor';
                    else if (id.includes('yaml-editor')) currentView = 'yaml-editor';
                    else if (id.includes('randomspawn')) currentView = 'randomspawn-editor';
                    else if (id.includes('spawner')) currentView = 'spawner';
                    else if (id.includes('stats')) currentView = 'stats';
                    else if (id.includes('files')) currentView = 'files';
                    else if (id.includes('dashboard')) currentView = 'dashboard';
                    else if (id.includes('home')) currentView = 'home';
                });
            }
            
            // Only update if changed
            if (document.body.dataset.currentView !== currentView) {
                document.body.dataset.currentView = currentView;
                // Show/hide editor action bar based on view
                this.updateEditorActionBar(currentView);
            }
        };
        
        // Debounced version for observer (prevents UI freezing)
        const debouncedUpdate = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => updateCurrentView(), 100);
        };
        
        // Listen to viewchange events dispatched by app.js (primary method)
        document.addEventListener('viewchange', (e) => {
            const view = e.detail?.view || null;
            // Cancel any pending debounced update since we have explicit view info
            if (debounceTimer) clearTimeout(debounceTimer);
            updateCurrentView(view);
        });
        
        // Initial check
        updateCurrentView();
        
        // Watch for view changes - ONLY watch .view-container class changes, not entire DOM
        const observer = new MutationObserver((mutations) => {
            // Only trigger if a view-container's class changed
            const viewChanged = mutations.some(m => 
                m.target.classList?.contains('view-container') && 
                m.attributeName === 'class'
            );
            if (viewChanged) {
                debouncedUpdate();
            }
        });
        
        // Only observe the editor-content container, not entire body
        const editorContent = document.getElementById('editor-content');
        if (editorContent) {
            observer.observe(editorContent, { 
                attributes: true,
                attributeFilter: ['class'],
                subtree: true
            });
        }
        
        // Also listen to custom navigation events (editoropen/close for legacy support)
        document.addEventListener('editoropen', () => updateCurrentView());
        document.addEventListener('editorclose', () => updateCurrentView());
    }
    
    /**
     * Initialize floating editor action bar
     */
    initEditorActionBar() {
        // Create the action bar container
        let actionBar = document.getElementById('mobile-editor-action-bar');
        if (!actionBar) {
            actionBar = document.createElement('div');
            actionBar.id = 'mobile-editor-action-bar';
            actionBar.className = 'mobile-editor-action-bar';
            actionBar.style.display = 'none';
            document.body.appendChild(actionBar);
        }
        this.dom.editorActionBar = actionBar;
    }
    
    /**
     * Update editor action bar based on current view
     */
    updateEditorActionBar(currentView) {
        const actionBar = this.dom.editorActionBar || document.getElementById('mobile-editor-action-bar');
        if (!actionBar) return;
        
        // Guard against null/undefined currentView
        if (!currentView || typeof currentView !== 'string') {
            actionBar.style.display = 'none';
            return;
        }
        
        const isEditorView = currentView.includes('editor') || currentView === 'spawner' || currentView === 'stats';
        
        if (isEditorView) {
            // Find editor actions in the current view
            const currentViewEl = document.querySelector(`#${currentView.replace('-editor', '-editor-view')}, #${currentView}-view`);
            const editorActions = currentViewEl?.querySelector('.editor-actions, .card-actions, .card-actions-row');
            
            if (editorActions) {
                // Clone action buttons to the floating bar
                actionBar.innerHTML = '';
                
                // Find save button
                const saveBtn = editorActions.querySelector('.btn-primary, [data-action="save"], .save-btn');
                if (saveBtn) {
                    const clonedSave = saveBtn.cloneNode(true);
                    clonedSave.addEventListener('click', () => saveBtn.click());
                    actionBar.appendChild(clonedSave);
                }
                
                // Find other common buttons
                const otherBtns = editorActions.querySelectorAll('.btn:not(.btn-primary):not(.btn-danger)');
                otherBtns.forEach((btn, i) => {
                    if (i < 2) { // Limit to 2 additional buttons
                        const cloned = btn.cloneNode(true);
                        cloned.addEventListener('click', () => btn.click());
                        actionBar.appendChild(cloned);
                    }
                });
                
                // Find delete button
                const deleteBtn = editorActions.querySelector('.btn-danger, [data-action="delete"], .delete-btn');
                if (deleteBtn) {
                    const clonedDelete = deleteBtn.cloneNode(true);
                    clonedDelete.addEventListener('click', () => {
                        if (confirm('Delete this item?')) {
                            deleteBtn.click();
                        }
                    });
                    actionBar.appendChild(clonedDelete);
                }
                
                // Show action bar if we have buttons
                if (actionBar.children.length > 0) {
                    actionBar.style.display = 'flex';
                } else {
                    actionBar.style.display = 'none';
                }
            } else {
                actionBar.style.display = 'none';
            }
        } else {
            actionBar.style.display = 'none';
        }
    }
}

// Export for use
window.MobileManager = MobileManager;
