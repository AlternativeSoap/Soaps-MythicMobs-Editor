
    /**
     * Render the interactive grid
     */
    renderGrid() {
        const gridContainer = this.modalElement.querySelector('#totem-builder-grid');
        const wrapperContainer = this.modalElement.querySelector('#totem-builder-grid-container');
        
        // Clear existing grid
        gridContainer.innerHTML = '';
        wrapperContainer.querySelectorAll('.grid-label').forEach(label => label.remove());
        
        const size = this.gridState.gridSize;
        const center = Math.floor(size / 2);
        const currentY = this.gridState.currentY;
        const view = this.gridState.currentView;
        
        gridContainer.style.gridTemplateColumns = `repeat(${size}, 32px)`;
        gridContainer.style.gridTemplateRows = `repeat(${size}, 32px)`;
        
        // Create grid cells
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const cell = document.createElement('div');
                cell.className = 'totem-grid-cell';
                
                // Calculate 3D coordinates based on view
                let x, y, z;
                if (view === 'top') {
                    x = col - center;
                    y = currentY;
                    z = row - center;
                } else if (view === 'front') {
                    x = col - center;
                    y = row - center;
                    z = currentY;
                } else { // side
                    x = currentY;
                    y = row - center;
                    z = col - center;
                }
                
                const key = `${x},${y},${z}`;
                const hasBlock = this.gridState.blocks.has(key);
                
                // Style cell
                cell.style.cssText = `
                    width: 32px;
                    height: 32px;
                    border: 1px solid rgba(139, 92, 246, 0.2);
                    cursor: pointer;
                    transition: all 0.1s;
                    position: relative;
                `;
                
                // Highlight center (spawn point)
                if (x === 0 && y === 0 && z === 0) {
                    cell.style.background = 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, rgba(251, 191, 36, 0.1) 100%)';
                    cell.style.border = '2px solid rgba(251, 191, 36, 0.6)';
                    cell.innerHTML = '<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #fbbf24; font-weight: bold;">⊕</div>';
                } else if (hasBlock) {
                    cell.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.5) 0%, rgba(99, 102, 241, 0.5) 100%)';
                    cell.style.border = '2px solid rgba(139, 92, 246, 0.8)';
                } else {
                    cell.style.background = 'rgba(0, 0, 0, 0.3)';
                }
                
                // Store coordinates
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.dataset.z = z;
                
                // Click handlers
                cell.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.placeBlock(x, y, z);
                });
                
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.removeBlock(x, y, z);
                });
                
                // Hover effect
                cell.addEventListener('mouseenter', () => {
                    if (!hasBlock && !(x === 0 && y === 0 && z === 0)) {
                        cell.style.background = 'rgba(139, 92, 246, 0.2)';
                        cell.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                    }
                });
                
                cell.addEventListener('mouseleave', () => {
                    if (!hasBlock && !(x === 0 && y === 0 && z === 0)) {
                        cell.style.background = 'rgba(0, 0, 0, 0.3)';
                        cell.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                    }
                });
                
                gridContainer.appendChild(cell);
            }
        }
        
        // Add coordinate labels
        const labelStyle = 'position: absolute; font-size: 10px; font-weight: 600; color: rgba(139, 92, 246, 0.7); font-family: var(--font-mono);';
        
        // Top labels
        for (let col = 0; col < size; col++) {
            const label = document.createElement('div');
            const coord = col - center;
            label.className = 'grid-label';
            label.textContent = coord >= 0 ? `+${coord}` : coord;
            label.style.cssText = labelStyle + `top: -20px; left: ${col * 34 + 12}px;`;
            wrapperContainer.appendChild(label);
        }
        
        // Left labels
        for (let row = 0; row < size; row++) {
            const label = document.createElement('div');
            const coord = row - center;
            label.className = 'grid-label';
            label.textContent = coord >= 0 ? `+${coord}` : coord;
            label.style.cssText = labelStyle + `top: ${row * 34 + 8}px; left: -30px;`;
            wrapperContainer.appendChild(label);
        }
    }
    
    /**
     * Place a block at the specified coordinates
     */
    placeBlock(x, y, z) {
        const key = `${x},${y},${z}`;
        const material = this.gridState.currentMaterial;
        
        if (!material) {
            alert('Please select a paint material first!');
            return;
        }
        
        this.gridState.blocks.set(key, material);
        
        // Symmetry mode
        if (this.gridState.symmetryMode && this.gridState.currentView === 'top') {
            const mirrorKey = `${-x},${y},${z}`;
            if (x !== 0) { // Don't mirror center
                this.gridState.blocks.set(mirrorKey, material);
            }
        }
        
        this.saveToHistory();
        this.renderGrid();
        this.renderPreview();
        this.updateStatistics();
    }
    
    /**
     * Remove a block at the specified coordinates
     */
    removeBlock(x, y, z) {
        const key = `${x},${y},${z}`;
        this.gridState.blocks.delete(key);
        
        // Symmetry mode
        if (this.gridState.symmetryMode && this.gridState.currentView === 'top') {
            const mirrorKey = `${-x},${y},${z}`;
            this.gridState.blocks.delete(mirrorKey);
        }
        
        this.saveToHistory();
        this.renderGrid();
        this.renderPreview();
        this.updateStatistics();
    }
    
    /**
     * Render the 3D preview
     */
    renderPreview() {
        if (!this.renderer) return;
        
        // Convert blocks Map to array format for renderer
        const blocks = [];
        this.gridState.blocks.forEach((material, key) => {
            const [x, y, z] = key.split(',').map(Number);
            blocks.push({ x, y, z, material });
        });
        
        this.renderer.render({
            Head: this.totemData.Head,
            Pattern: blocks
        });
    }
    
    /**
     * Update statistics display
     */
    updateStatistics() {
        const totalBlocks = this.gridState.blocks.size;
        const totalBlocksEl = this.modalElement.querySelector('#totem-builder-total-blocks');
        totalBlocksEl.textContent = totalBlocks;
        
        // Calculate dimensions
        if (totalBlocks === 0) {
            this.modalElement.querySelector('#totem-builder-size').textContent = '0×0×0';
            this.modalElement.querySelector('#totem-builder-layer-count').textContent = '0';
            return;
        }
        
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        const yLayers = new Set();
        
        this.gridState.blocks.forEach((material, key) => {
            const [x, y, z] = key.split(',').map(Number);
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
            minZ = Math.min(minZ, z);
            maxZ = Math.max(maxZ, z);
            yLayers.add(y);
        });
        
        const width = maxX - minX + 1;
        const height = maxY - minY + 1;
        const depth = maxZ - minZ + 1;
        
        this.modalElement.querySelector('#totem-builder-size').textContent = `${width}×${height}×${depth}`;
        this.modalElement.querySelector('#totem-builder-layer-count').textContent = yLayers.size;
    }
    
    // SECTION 5: Transform Tools & Template Loading
    
    /**
     * Load a template into the grid
     */
    loadTemplate(templateName) {
        const template = this.templates.find(t => t.name === templateName);
        if (!template) return;
        
        // Clear existing blocks
        this.gridState.blocks.clear();
        
        // Load template pattern
        template.pattern.forEach(block => {
            const key = `${block.x},${block.y},${block.z}`;
            this.gridState.blocks.set(key, block.material);
        });
        
        this.saveToHistory();
        this.renderGrid();
        this.renderPreview();
        this.updateStatistics();
    }
    
    /**
     * Rotate totem 90° clockwise (Y-axis)
     */
    rotateTotem() {
        const newBlocks = new Map();
        
        this.gridState.blocks.forEach((material, key) => {
            const [x, y, z] = key.split(',').map(Number);
            // Rotate around Y-axis: (x, y, z) -> (z, y, -x)
            const newX = z;
            const newZ = -x;
            const newKey = `${newX},${y},${newZ}`;
            newBlocks.set(newKey, material);
        });
        
        this.gridState.blocks = newBlocks;
        this.saveToHistory();
        this.renderGrid();
        this.renderPreview();
    }
    
    /**
     * Mirror totem along X axis
     */
    mirrorTotemX() {
        const newBlocks = new Map();
        
        this.gridState.blocks.forEach((material, key) => {
            const [x, y, z] = key.split(',').map(Number);
            const newKey = `${-x},${y},${z}`;
            newBlocks.set(newKey, material);
        });
        
        this.gridState.blocks = newBlocks;
        this.saveToHistory();
        this.renderGrid();
        this.renderPreview();
    }
    
    /**
     * Mirror totem along Z axis
     */
    mirrorTotemZ() {
        const newBlocks = new Map();
        
        this.gridState.blocks.forEach((material, key) => {
            const [x, y, z] = key.split(',').map(Number);
            const newKey = `${x},${y},${-z}`;
            newBlocks.set(newKey, material);
        });
        
        this.gridState.blocks = newBlocks;
        this.saveToHistory();
        this.renderGrid();
        this.renderPreview();
    }
    
    /**
     * Center totem at origin
     */
    centerTotem() {
        if (this.gridState.blocks.size === 0) return;
        
        // Find current bounds
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        
        this.gridState.blocks.forEach((material, key) => {
            const [x, y, z] = key.split(',').map(Number);
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
            minZ = Math.min(minZ, z);
            maxZ = Math.max(maxZ, z);
        });
        
        // Calculate offset to center
        const offsetX = -Math.floor((minX + maxX) / 2);
        const offsetY = -Math.floor((minY + maxY) / 2);
        const offsetZ = -Math.floor((minZ + maxZ) / 2);
        
        // Apply offset
        const newBlocks = new Map();
        this.gridState.blocks.forEach((material, key) => {
            const [x, y, z] = key.split(',').map(Number);
            const newKey = `${x + offsetX},${y + offsetY},${z + offsetZ}`;
            newBlocks.set(newKey, material);
        });
        
        this.gridState.blocks = newBlocks;
        this.saveToHistory();
        this.renderGrid();
        this.renderPreview();
    }
    
    /**
     * Clear all blocks
     */
    clearTotem() {
        if (this.gridState.blocks.size === 0) return;
        
        if (!confirm('Are you sure you want to clear the entire totem? This cannot be undone.')) {
            return;
        }
        
        this.gridState.blocks.clear();
        this.saveToHistory();
        this.renderGrid();
        this.renderPreview();
        this.updateStatistics();
    }
