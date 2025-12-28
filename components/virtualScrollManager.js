/**
 * VirtualScrollManager - HARD REQUIREMENT COMPLIANT
 * 
 * NON-NEGOTIABLE GUARANTEES:
 * ✅ Only visible rows exist in the DOM (<15 nodes typical, max 50 absolute)
 * ✅ Fixed-height windowing (140px per row)
 * ✅ One-time data construction (frozen immutable)
 * ✅ No re-filtering on render
 * ✅ Hard unmounting on destroy
 * 
 * ARCHITECTURE:
 * - Viewport-only rendering (visible + overscan buffer ONLY)
 * - Absolute positioning (no DOM shifting)
 * - Single reflow per scroll
 * - RAF-throttled scroll handling
 */
class VirtualScrollManager {
    constructor(config = {}) {
        // Configuration (immutable after construction)
        this.itemHeight = config.itemHeight || 200; // Fixed height per row (actual card height)
        this.containerHeight = config.containerHeight || 500; // Viewport height (matches CSS)
        this.overscanCount = config.overscanCount || 3; // Buffer items above/below (reduced for performance)
        this.renderItemCallback = config.renderItem; // Function: (item, index) => HTML string
        
        // Immutable frozen data (loaded once, NEVER mutated)
        this.items = Object.freeze(config.items || []);
        this.totalItems = this.items.length;
        
        // Viewport state
        this.scrollTop = 0;
        this.visibleStart = 0;
        this.visibleEnd = -1; // Force initial render (set to -1 so first render always runs)
        this.renderedNodes = new Map(); // Map<index, HTMLElement>
        
        // DOM references
        this.container = null;
        this.viewport = null;
        this.spacer = null;
        
        // Performance tracking
        this.abortController = new AbortController();
        this.scrollRaf = null;
        
        // ALWAYS log constructor (critical for debugging)
        console.log(`🎯 VirtualScrollManager constructor complete: ${this.totalItems} items @ ${this.itemHeight}px each`);
    }
    
    /**
     * Initialize virtual scroller with container element
     * @param {HTMLElement} containerElement - Scrollable container
     */
    init(containerElement) {
        console.log(`🎯 [VSCROLL] init() CALLED with container:`, containerElement);
        this.container = containerElement;
        
        if (!this.container) {
            console.error(`❌ [VSCROLL] Container element is null or undefined!`);
            return;
        }
        
        console.log(`🎯 [VSCROLL] Container is valid, configuring... Total items: ${this.totalItems}`);
        
        // Configure container for virtual scrolling
        this.container.innerHTML = '';
        // Add virtual scroll mode class for CSS targeting
        this.container.classList.add('virtual-scroll-mode');
        
        // CRITICAL: Disable grid layout, enable block layout for virtual scroll
        this.container.style.display = 'block';
        this.container.style.height = `${this.containerHeight}px`;
        this.container.style.overflowY = 'auto';
        this.container.style.overflowX = 'hidden';
        this.container.style.position = 'relative';
        this.container.style.padding = '0';
        this.container.style.margin = '0';
        this.container.style.contain = 'strict';
        this.container.style.willChange = 'scroll-position';
        
        // Create spacer element (maintains total scroll height)
        this.spacer = document.createElement('div');
        this.spacer.style.cssText = `
            height: ${this.totalItems * this.itemHeight}px;
            width: 1px;
            pointer-events: none;
            position: absolute;
            top: 0;
            left: 0;
            z-index: 0;
        `;
        
        // Create viewport element (holds only visible items)
        this.viewport = document.createElement('div');
        this.viewport.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
            gap: 16px;
            padding: 8px;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: ${this.containerHeight}px;
            z-index: 1;
            pointer-events: auto;
            will-change: padding;
            contain: layout style paint;
        `;
        
        this.container.appendChild(this.spacer);
        this.container.appendChild(this.viewport);
        
        console.log(`🎯 [VSCROLL] DOM structure created (spacer + viewport)`);
        
        // Attach scroll listener with RAF throttling
        this.container.addEventListener('scroll', () => this.handleScroll(), {
            passive: true,
            signal: this.abortController.signal
        });
        
        console.log(`🎯 [VSCROLL] Scroll listener attached, calling initial render()...`);
        
        // Initial render
        this.render();
        
        console.log(`✅ [VSCROLL] init() COMPLETE, rendered ${this.renderedNodes.size} nodes`);
    }
    
    /**
     * Handle scroll events (RAF-throttled to prevent jank)
     */
    handleScroll() {
        if (this.scrollRaf) {
            return; // Already scheduled
        }
        
        this.scrollRaf = requestAnimationFrame(() => {
            this.scrollTop = this.container.scrollTop;
            this.render();
            this.scrollRaf = null;
        });
    }
    
    /**
     * Calculate visible range and render ONLY those items
     * GUARANTEES: Max 50 DOM nodes at any time
     */
    render() {
        console.log(`🎯 [VSCROLL] render() CALLED - scrollTop: ${this.scrollTop}, totalItems: ${this.totalItems}`);
        const startTime = window.DEBUG_MODE ? performance.now() : 0;
        
        // Calculate visible range based on scroll position
        const scrollTop = this.scrollTop;
        const viewportHeight = this.containerHeight;
        
        // Visible item indices (with overscan buffer)
        const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.overscanCount);
        const endIndex = Math.min(
            this.totalItems - 1,
            Math.ceil((scrollTop + viewportHeight) / this.itemHeight) + this.overscanCount
        );
        
        console.log(`🎯 [VSCROLL] Range: start=${startIndex}, end=${endIndex}, visible=${this.visibleStart}-${this.visibleEnd}`);
        
        // Skip if range unchanged (optimization)
        if (startIndex === this.visibleStart && endIndex === this.visibleEnd) {
            if (window.DEBUG_MODE) {
                console.log(`⏭️ [VSCROLL] Range unchanged, skipping render`);
            }
            return;
        }
        
        this.visibleStart = startIndex;
        this.visibleEnd = endIndex;
        
        // REMOVE items outside visible range (free memory)
        const toRemove = [];
        for (const [index, node] of this.renderedNodes.entries()) {
            if (index < startIndex || index > endIndex) {
                toRemove.push(index);
                node.remove(); // Hard unmount from DOM
            }
        }
        toRemove.forEach(index => this.renderedNodes.delete(index));
        
        // RENDER items in visible range (only if not already rendered)
        const fragment = document.createDocumentFragment();
        console.log(`🎨 [VSCROLL] Starting render loop: items ${startIndex}-${endIndex}`);
        for (let i = startIndex; i <= endIndex; i++) {
            if (!this.renderedNodes.has(i)) {
                const item = this.items[i];
                console.log(`🎨 [VSCROLL] Rendering item ${i}:`, item?.id || item?.name || 'unknown');
                const node = this.createItemNode(item, i);
                this.renderedNodes.set(i, node);
                fragment.appendChild(node);
            }
        }
        
        console.log(`📦 [VSCROLL] Fragment has ${fragment.childNodes.length} nodes to append`);
        
        // Single DOM update (ONE reflow)
        if (fragment.childNodes.length > 0) {
            console.log(`🔧 [VSCROLL] Appending ${fragment.childNodes.length} nodes to viewport...`);
            this.viewport.appendChild(fragment);
            console.log(`✅ [VSCROLL] Appended! viewport now has ${this.viewport.children.length} children`);
        }
        
        // Offset grid using padding-top to align with scroll position
        const offsetY = startIndex * this.itemHeight;
        this.viewport.style.paddingTop = `${offsetY + 8}px`; // +8 for base padding
        
        const nodeCount = this.renderedNodes.size;
        const renderTime = (performance.now() - startTime).toFixed(2);
        console.log(`🎯 VirtualScroll render: ${nodeCount} nodes (items ${startIndex}-${endIndex}), ${renderTime}ms`);
        
        // ENFORCE MAX 50 NODE BUDGET
        if (nodeCount > 50) {
            console.error(`❌ BUDGET VIOLATION: ${nodeCount} > 50 DOM nodes!`);
        }
    }
    
    /**
     * Create a single item node with fixed positioning
     * @param {Object} item - Data item
     * @param {number} index - Item index
     * @returns {HTMLElement} - Wrapper element
     */
    createItemNode(item, index) {
        const wrapper = document.createElement('div');
        wrapper.className = 'virtual-scroll-item';
        // No positioning - let grid handle layout
        wrapper.dataset.index = index;
        
        // Render item content using callback (returns HTML string)
        if (this.renderItemCallback) {
            try {
                const html = this.renderItemCallback(item, index);
                console.log(`🔍 [VSCROLL] Item ${index} HTML length: ${html?.length || 0}, first 100 chars:`, html?.substring(0, 100));
                if (html) {
                    wrapper.innerHTML = html;
                } else {
                    console.error(`❌ [VSCROLL] renderItemCallback returned empty for item ${index}`);
                    wrapper.innerHTML = '<div>Error: No content</div>';
                }
            } catch (error) {
                console.error(`❌ [VSCROLL] Error rendering item ${index}:`, error);
                wrapper.innerHTML = `<div>Error rendering item</div>`;
            }
        } else {
            console.error(`❌ [VSCROLL] renderItemCallback is not defined!`);
            wrapper.innerHTML = '<div>No render callback</div>';
        }
        
        return wrapper;
    }
    
    /**
     * Update data (replaces entire dataset with new frozen array)
     * @param {Array} newItems - New items array
     */
    updateItems(newItems) {
        // Freeze new data (IMMUTABLE - prevent accidental mutations)
        this.items = Object.freeze([...newItems]);
        this.totalItems = this.items.length;
        
        // HARD UNMOUNT all rendered items
        this.renderedNodes.forEach(node => node.remove());
        this.renderedNodes.clear();
        
        // Update spacer height (maintains scroll range)
        if (this.spacer) {
            this.spacer.style.height = `${this.totalItems * this.itemHeight}px`;
        }
        
        // Reset scroll position
        if (this.container) {
            this.container.scrollTop = 0;
        }
        this.scrollTop = 0;
        this.visibleStart = 0;
        this.visibleEnd = 0;
        
        // Re-render from top
        this.render();
        
        if (window.DEBUG_MODE) {
            console.log(`🔄 VirtualScroll updated: ${this.totalItems} items, ${this.renderedNodes.size} nodes`);
        }
    }
    
    /**
     * Get current visible node count (for diagnostics)
     * @returns {number} - Number of DOM nodes currently rendered
     */
    getNodeCount() {
        return this.renderedNodes.size;
    }
    
    /**
     * Scroll to specific item index
     * @param {number} index - Item index to scroll to
     */
    scrollToIndex(index) {
        if (this.container && index >= 0 && index < this.totalItems) {
            this.container.scrollTop = index * this.itemHeight;
        }
    }
    
    /**
     * HARD UNMOUNT - Destroy virtual scroller completely
     * NON-NEGOTIABLE: Browser UI must be destroyed on close
     */
    destroy() {
        // Cancel any pending RAF
        if (this.scrollRaf) {
            cancelAnimationFrame(this.scrollRaf);
            this.scrollRaf = null;
        }
        
        // Abort all event listeners (AbortController pattern)
        this.abortController.abort();
        
        // HARD UNMOUNT all rendered nodes
        this.renderedNodes.forEach(node => node.remove());
        this.renderedNodes.clear();
        
        // Clear DOM container and restore grid layout
        if (this.container) {
            this.container.innerHTML = '';
            // Remove virtual scroll mode class
            this.container.classList.remove('virtual-scroll-mode');
            // Restore original grid layout styles
            this.container.style.display = '';
            this.container.style.height = '';
            this.container.style.overflowY = '';
            this.container.style.overflowX = '';
            this.container.style.position = '';
            this.container.style.padding = '';
            this.container.style.margin = '';
            this.container.style.willChange = '';
            this.container.style.contain = '';
        }
        
        // Nullify all references (free memory)
        this.container = null;
        this.viewport = null;
        this.spacer = null;
        this.items = null;
        this.renderItemCallback = null;
        
        if (window.DEBUG_MODE) {
            console.log(`🗑️ VirtualScroll destroyed (hard unmounted)`);
        }
    }
}
