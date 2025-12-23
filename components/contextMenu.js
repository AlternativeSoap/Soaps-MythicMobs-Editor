/**
 * Context Menu Component
 * Reusable right-click context menu system
 */
class ContextMenu {
    constructor() {
        this.menu = null;
        this.currentTarget = null;
        this.currentData = null;
        this.actions = new Map();
        
        this.init();
    }
    
    init() {
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
        });
        
        // Close menu on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        });
        
        // Prevent menu from closing when clicking inside
        this.menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    /**
     * Show context menu at position with items
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Array} items - Menu items [{label, icon, action, danger}]
     * @param {*} data - Data to pass to action handlers
     */
    show(x, y, items, data = null) {
        this.currentData = data;
        
        // Build menu HTML
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
        
        // Attach click handlers
        this.menu.querySelectorAll('.context-menu-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                const handler = this.actions.get(action);
                
                if (handler) {
                    handler(this.currentData, e);
                }
                
                this.hide();
            });
        });
        
        // Position menu
        this.menu.style.left = x + 'px';
        this.menu.style.top = y + 'px';
        
        // Show menu
        this.menu.classList.add('visible');
        
        // Adjust position if menu goes off screen
        setTimeout(() => {
            const rect = this.menu.getBoundingClientRect();
            
            if (rect.right > window.innerWidth) {
                this.menu.style.left = (x - rect.width) + 'px';
            }
            
            if (rect.bottom > window.innerHeight) {
                this.menu.style.top = (y - rect.height) + 'px';
            }
        }, 0);
    }
    
    /**
     * Hide context menu
     */
    hide() {
        this.menu.classList.remove('visible');
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
