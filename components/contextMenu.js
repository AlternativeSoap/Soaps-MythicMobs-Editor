/**
 * Context Menu Component
 * Reusable right-click context menu system
 * Enhanced with mobile touch support
 */
class ContextMenu {
    constructor() {
        this.menu = null;
        this.backdrop = null;
        this.currentTarget = null;
        this.currentData = null;
        this.actions = new Map();
        this._boundHide = this.hide.bind(this);
        this._boundOnScroll = this._onScroll.bind(this);
        this._boundOnContextMenu = this._onContextMenu.bind(this);
        this._boundOnResize = this.hide.bind(this);
        
        // Mobile detection
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                       || window.innerWidth <= 768;
        
        this.init();
    }
    
    init() {
        // Create backdrop for mobile
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'context-menu-backdrop';
        document.body.appendChild(this.backdrop);
        
        // Create menu element
        this.menu = document.createElement('div');
        this.menu.className = 'context-menu';
        this.menu.setAttribute('role', 'menu');
        document.body.appendChild(this.menu);
        
        // Close menu on click outside
        document.addEventListener('click', (e) => {
            if (!this.menu.contains(e.target)) {
                this.hide();
            }
        }, true);
        
        // Close on backdrop click (mobile)
        this.backdrop.addEventListener('click', () => this.hide());
        this.backdrop.addEventListener('touchstart', () => this.hide(), { passive: true });
        
        // Close menu on any right-click (to show new menu or native menu)
        document.addEventListener('contextmenu', this._boundOnContextMenu, true);
        
        // Close menu on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        });
        
        // Close menu on scroll
        document.addEventListener('scroll', this._boundOnScroll, true);
        
        // Close menu on window resize
        window.addEventListener('resize', this._boundOnResize);
        
        // Prevent default context menu on our menu
        this.menu.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        
        // Update mobile state on resize
        window.addEventListener('resize', () => {
            this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                           || window.innerWidth <= 768;
        });
    }
    
    _onScroll(e) {
        // Hide menu when scrolling anywhere except inside the menu itself
        if (!this.menu.contains(e.target)) {
            this.hide();
        }
    }
    
    _onContextMenu(e) {
        // When a new context menu is triggered, hide the current one first
        // This allows the new menu to show (either ours or native)
        if (!this.menu.contains(e.target)) {
            this.hide();
        }
    }
    
    /**
     * Show context menu at position with items
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Array} items - Menu items [{label, icon, action, danger}]
     * @param {*} data - Data to pass to action handlers
     */
    show(x, y, items, data = null) {
        // Hide any existing menu first
        this.hide();
        
        this.currentData = data;
        
        // Check if mobile for positioning
        const isMobileView = document.body.dataset.device === 'mobile' || this.isMobile;
        
        // Build menu HTML with mobile-friendly touch targets
        this.menu.innerHTML = items.map(item => {
            if (item.separator) {
                return '<div class="context-menu-separator"></div>';
            }
            
            const dangerClass = item.danger ? 'danger' : '';
            return `
                <button class="context-menu-item ${dangerClass}" data-action="${item.action}">
                    <i class="fas ${item.icon}"></i>
                    <span>${item.label}</span>
                </button>
            `;
        }).join('');
        
        // Attach click handlers (fresh for each show)
        this.menu.querySelectorAll('.context-menu-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const action = btn.dataset.action;
                const handler = this.actions.get(action);
                
                if (handler) {
                    handler(this.currentData, e);
                }
                
                this.hide();
            });
            
            // Touch support
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const action = btn.dataset.action;
                const handler = this.actions.get(action);
                
                if (handler) {
                    handler(this.currentData, e);
                }
                
                this.hide();
            });
        });
        
        // Mobile: Show as bottom sheet
        if (isMobileView) {
            this.menu.classList.add('mobile-sheet');
            this.backdrop.classList.add('visible');
            this.menu.classList.add('visible');
            
            // Animate in with slight delay
            requestAnimationFrame(() => {
                this.menu.style.transform = 'translateY(0)';
            });
        } else {
            // Desktop: Position at cursor
            this.menu.classList.remove('mobile-sheet');
            
            // Position menu initially off-screen to measure
            this.menu.style.left = '-9999px';
            this.menu.style.top = '-9999px';
            this.menu.style.transform = '';
            this.menu.classList.add('visible');
            
            // Get dimensions after rendering
            requestAnimationFrame(() => {
                const rect = this.menu.getBoundingClientRect();
                const menuWidth = rect.width;
                const menuHeight = rect.height;
                
                // Calculate position with boundary checks
                let finalX = x;
                let finalY = y;
                
                // Check right boundary
                if (x + menuWidth > window.innerWidth - 10) {
                    finalX = x - menuWidth;
                }
                
                // Check bottom boundary
                if (y + menuHeight > window.innerHeight - 10) {
                    finalY = y - menuHeight;
                }
                
                // Ensure not off left or top edge
                finalX = Math.max(10, finalX);
                finalY = Math.max(10, finalY);
                
                this.menu.style.left = finalX + 'px';
                this.menu.style.top = finalY + 'px';
            });
        }
    }
    
    /**
     * Hide context menu
     */
    hide() {
        const isMobileView = document.body.dataset.device === 'mobile' || this.isMobile;
        
        if (isMobileView) {
            this.menu.style.transform = 'translateY(100%)';
            this.backdrop.classList.remove('visible');
            
            // Delay removal of visible class for animation
            setTimeout(() => {
                this.menu.classList.remove('visible');
                this.menu.classList.remove('mobile-sheet');
            }, 200);
        } else {
            this.menu.classList.remove('visible');
        }
        
        this.currentTarget = null;
        this.currentData = null;
    }
    
    /**
     * Register action handler
     * @param {string} action - Action name
     * @param {Function} handler - Handler function (data, event) => {}
     */
    registerAction(action, handler) {
        this.actions.set(action, handler);
    }
    
    /**
     * Unregister action handler
     * @param {string} action - Action name
     */
    unregisterAction(action) {
        this.actions.delete(action);
    }
}
