/**
 * Panel Resizer - Handles resizable panels with drag functionality
 */
class PanelResizer {
    constructor() {
        this.isResizing = false;
        this.currentHandle = null;
        this.startX = 0;
        this.startWidth = 0;
        this.minWidth = 200;
        this.maxWidth = 800;
    }
    
    init() {
        if (window.DEBUG_MODE) console.log('🔧 Initializing PanelResizer...');
        this.loadSizes();
        this.attachHandlers();
    }
    
    attachHandlers() {
        // Left resize handle (between left sidebar and center)
        const leftHandle = document.getElementById('resize-left');
        if (leftHandle) {
            leftHandle.addEventListener('mousedown', (e) => this.startResize(e, 'left'));
            leftHandle.style.cursor = 'col-resize';
        } else if (window.DEBUG_MODE) {
            console.warn('❌ Left resize handle not found');
        }
        
        // Right resize handle (between center and right sidebar)
        const rightHandle = document.getElementById('resize-right');
        if (rightHandle) {
            rightHandle.addEventListener('mousedown', (e) => this.startResize(e, 'right'));
            rightHandle.style.cursor = 'col-resize';
        } else if (window.DEBUG_MODE) {
            console.warn('❌ Right resize handle not found');
        }
        
        // Global mouse move and up
        document.addEventListener('mousemove', (e) => this.resize(e));
        document.addEventListener('mouseup', () => this.stopResize());
    }
    
    startResize(e, side) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log(`🖱️ Starting resize: ${side}`);
        
        this.isResizing = true;
        this.currentHandle = side;
        this.startX = e.clientX;
        
        if (side === 'left') {
            const sidebar = document.getElementById('sidebar-left');
            this.startWidth = sidebar.offsetWidth;
            console.log(`📏 Left sidebar start width: ${this.startWidth}px`);
        } else if (side === 'right') {
            const sidebar = document.getElementById('sidebar-right');
            this.startWidth = sidebar.offsetWidth;
            console.log(`📏 Right sidebar start width: ${this.startWidth}px`);
        }
        
        // Add visual feedback
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.querySelector('.app-content')?.classList.add('resizing');
    }
    
    resize(e) {
        if (!this.isResizing) return;
        
        const deltaX = e.clientX - this.startX;
        
        if (this.currentHandle === 'left') {
            const newWidth = Math.max(this.minWidth, Math.min(this.maxWidth, this.startWidth + deltaX));
            const sidebar = document.getElementById('sidebar-left');
            if (sidebar) {
                sidebar.style.width = `${newWidth}px`;
                sidebar.style.minWidth = `${newWidth}px`;
            }
        } else if (this.currentHandle === 'right') {
            const newWidth = Math.max(this.minWidth, Math.min(this.maxWidth, this.startWidth - deltaX));
            const sidebar = document.getElementById('sidebar-right');
            if (sidebar) {
                sidebar.style.width = `${newWidth}px`;
                sidebar.style.minWidth = `${newWidth}px`;
            }
        }
    }
    
    stopResize() {
        if (!this.isResizing) return;
        
        console.log('🛑 Stopping resize');
        
        this.isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.querySelector('.app-content')?.classList.remove('resizing');
        
        // Save sizes
        this.saveSizes();
        this.currentHandle = null;
    }
    
    saveSizes() {
        const leftSidebar = document.getElementById('sidebar-left');
        const rightSidebar = document.getElementById('sidebar-right');
        
        const sizes = {
            left: leftSidebar?.offsetWidth || 280,
            right: rightSidebar?.offsetWidth || 320
        };
        
        localStorage.setItem('panelSizes', JSON.stringify(sizes));
    }
    
    loadSizes() {
        const saved = localStorage.getItem('panelSizes');
        if (!saved) return;
        
        try {
            const sizes = JSON.parse(saved);
            
            const leftSidebar = document.getElementById('sidebar-left');
            if (leftSidebar && sizes.left) {
                leftSidebar.style.width = `${sizes.left}px`;
                leftSidebar.style.minWidth = `${sizes.left}px`;
            }
            
            const rightSidebar = document.getElementById('sidebar-right');
            if (rightSidebar && sizes.right) {
                rightSidebar.style.width = `${sizes.right}px`;
                rightSidebar.style.minWidth = `${sizes.right}px`;
            }
        } catch (e) {
            console.error('Failed to load panel sizes:', e);
        }
    }
}

window.PanelResizer = PanelResizer;
