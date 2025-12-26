/**
 * Totem Renderer
 * Renders 2D orthographic Minecraft-style totem structure preview
 */

class TotemRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.blockSize = 32; // Size of each block in pixels
        this.padding = 40;
        this.currentView = 'top'; // top, front, side
        
        // Minecraft block colors (simplified)
        this.blockColors = {
            'AIR': 'transparent',
            'NETHERITE_BLOCK': '#433C3D',
            'PLAYER_HEAD': '#D4A574',
            'PLAYER_WALL_HEAD': '#D4A574',
            'DIAMOND_BLOCK': '#5DECCC',
            'GOLD_BLOCK': '#FCEE4B',
            'IRON_BLOCK': '#D8D8D8',
            'EMERALD_BLOCK': '#17DD62',
            'COAL_BLOCK': '#191919',
            'REDSTONE_BLOCK': '#A81D15',
            'LAPIS_BLOCK': '#1E4A9B',
            'QUARTZ_BLOCK': '#EAE5DD',
            'OBSIDIAN': '#0F0A2C',
            'BEDROCK': '#565656',
            'STONE': '#7F7F7F',
            'COBBLESTONE': '#7A7A7A',
            'DIRT': '#8B6547',
            'GRASS_BLOCK': '#6DAD3B',
            'SAND': '#DBD3A0',
            'GLASS': 'rgba(175, 228, 235, 0.3)',
            'WHITE_WOOL': '#E9ECF0',
            'BLACK_WOOL': '#1E1B1B',
            'RED_WOOL': '#A72820',
            'BLUE_WOOL': '#35399D',
            'GREEN_WOOL': '#55681F',
            'YELLOW_WOOL': '#F8C527',
            'PURPLE_WOOL': '#792AAC',
            'ORANGE_WOOL': '#F07613',
        };
    }
    
    /**
     * Set the current view mode
     */
    setView(view) {
        this.currentView = view;
    }
    
    /**
     * Parse pattern array into structured block data
     */
    parsePattern(patternArray) {
        if (!Array.isArray(patternArray)) return [];
        
        return patternArray.map(entry => {
            const parts = entry.trim().split(/\s+/);
            const coords = parts[0].split(',');
            const material = parts.slice(1).join('_').toUpperCase();
            
            return {
                x: parseInt(coords[0]) || 0,
                y: parseInt(coords[1]) || 0,
                z: parseInt(coords[2]) || 0,
                material: material || 'STONE'
            };
        });
    }
    
    /**
     * Calculate bounds of the totem structure
     */
    calculateBounds(blocks) {
        if (blocks.length === 0) {
            return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0, width: 1, height: 1, depth: 1 };
        }
        
        const minX = Math.min(...blocks.map(b => b.x));
        const maxX = Math.max(...blocks.map(b => b.x));
        const minY = Math.min(...blocks.map(b => b.y));
        const maxY = Math.max(...blocks.map(b => b.y));
        const minZ = Math.min(...blocks.map(b => b.z));
        const maxZ = Math.max(...blocks.map(b => b.z));
        
        return {
            minX, maxX, minY, maxY, minZ, maxZ,
            width: maxX - minX + 1,
            height: maxY - minY + 1,
            depth: maxZ - minZ + 1
        };
    }
    
    /**
     * Render totem structure from pattern
     */
    renderTotem(patternArray, headBlock = 'PLAYER_HEAD') {
        const blocks = this.parsePattern(patternArray);
        
        if (blocks.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        const bounds = this.calculateBounds(blocks);
        
        // Render based on current view
        switch (this.currentView) {
            case 'top':
                this.renderTopView(blocks, bounds);
                break;
            case 'front':
                this.renderFrontView(blocks, bounds);
                break;
            case 'side':
                this.renderSideView(blocks, bounds);
                break;
            default:
                this.renderTopView(blocks, bounds);
        }
    }
    
    /**
     * Render top view (X-Z plane, looking down Y axis)
     */
    renderTopView(blocks, bounds) {
        const gridWidth = bounds.width;
        const gridDepth = bounds.depth;
        
        // Fixed canvas size for consistency
        const canvasWidth = 500;
        const canvasHeight = 400;
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        this.drawBackground(canvasWidth, canvasHeight);
        
        // Calculate centering offsets
        const gridPixelWidth = gridWidth * this.blockSize;
        const gridPixelHeight = gridDepth * this.blockSize;
        const centerOffsetX = (canvasWidth - gridPixelWidth) / 2;
        const centerOffsetY = (canvasHeight - gridPixelHeight) / 2;
        
        // Draw axis labels
        this.ctx.fillStyle = '#a78bfa';
        this.ctx.font = 'bold 12px monospace';
        this.ctx.fillText('X →', centerOffsetX - 30, centerOffsetY - 10);
        this.ctx.fillText('Z', centerOffsetX - 30, centerOffsetY + 10);
        this.ctx.fillText('↓', centerOffsetX - 30, centerOffsetY + 22);
        
        // Group blocks by Y level to show depth
        const blocksByY = {};
        blocks.forEach(block => {
            if (!blocksByY[block.y]) blocksByY[block.y] = [];
            blocksByY[block.y].push(block);
        });
        
        // Draw from bottom to top for proper layering
        const yLevels = Object.keys(blocksByY).map(Number).sort((a, b) => a - b);
        
        yLevels.forEach((yLevel, index) => {
            const opacity = 0.4 + (index / yLevels.length) * 0.6; // Deeper blocks are more opaque
            blocksByY[yLevel].forEach(block => {
                const x = centerOffsetX + (block.x - bounds.minX) * this.blockSize;
                const z = centerOffsetY + (block.z - bounds.minZ) * this.blockSize;
                this.draw2DBlock(x, z, block.material, block.x === 0 && block.y === 0 && block.z === 0, opacity, `Y=${yLevel}`);
            });
        });
        
        this.drawLegend(bounds, blocks.length, 'Top View (X-Z)');
    }
    
    /**
     * Render front view (X-Y plane, looking along Z axis)
     */
    renderFrontView(blocks, bounds) {
        const gridWidth = bounds.width;
        const gridHeight = bounds.height;
        
        // Fixed canvas size for consistency
        const canvasWidth = 500;
        const canvasHeight = 400;
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        this.drawBackground(canvasWidth, canvasHeight);
        
        // Calculate centering offsets
        const gridPixelWidth = gridWidth * this.blockSize;
        const gridPixelHeight = gridHeight * this.blockSize;
        const centerOffsetX = (canvasWidth - gridPixelWidth) / 2;
        const centerOffsetY = (canvasHeight - gridPixelHeight) / 2;
        
        // Draw axis labels
        this.ctx.fillStyle = '#a78bfa';
        this.ctx.font = 'bold 12px monospace';
        this.ctx.fillText('X →', centerOffsetX - 30, centerOffsetY - 10);
        this.ctx.fillText('Y', centerOffsetX - 30, canvasHeight - centerOffsetY + 20);
        this.ctx.fillText('↑', centerOffsetX - 30, canvasHeight - centerOffsetY + 8);
        
        // Draw blocks
        blocks.forEach(block => {
            const x = centerOffsetX + (block.x - bounds.minX) * this.blockSize;
            const y = centerOffsetY + (bounds.maxY - block.y) * this.blockSize;
            const zDepth = Math.abs(block.z) / Math.max(Math.abs(bounds.minZ), Math.abs(bounds.maxZ), 1);
            const opacity = 1 - (zDepth * 0.3); // Blocks further from Z=0 are slightly transparent
            this.draw2DBlock(x, y, block.material, block.x === 0 && block.y === 0 && block.z === 0, opacity, `Z=${block.z}`);
        });
        
        this.drawLegend(bounds, blocks.length, 'Front View (X-Y)');
    }
    
    /**
     * Render side view (Z-Y plane, looking along X axis)
     */
    renderSideView(blocks, bounds) {
        const gridDepth = bounds.depth;
        const gridHeight = bounds.height;
        
        // Fixed canvas size for consistency
        const canvasWidth = 500;
        const canvasHeight = 400;
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        this.drawBackground(canvasWidth, canvasHeight);
        
        // Calculate centering offsets
        const gridPixelWidth = gridDepth * this.blockSize;
        const gridPixelHeight = gridHeight * this.blockSize;
        const centerOffsetX = (canvasWidth - gridPixelWidth) / 2;
        const centerOffsetY = (canvasHeight - gridPixelHeight) / 2;
        
        // Draw axis labels
        this.ctx.fillStyle = '#a78bfa';
        this.ctx.font = 'bold 12px monospace';
        this.ctx.fillText('Z →', centerOffsetX - 30, centerOffsetY - 10);
        this.ctx.fillText('Y', centerOffsetX - 30, canvasHeight - centerOffsetY + 20);
        this.ctx.fillText('↑', centerOffsetX - 30, canvasHeight - centerOffsetY + 8);
        
        // Draw blocks
        blocks.forEach(block => {
            const z = centerOffsetX + (block.z - bounds.minZ) * this.blockSize;
            const y = centerOffsetY + (bounds.maxY - block.y) * this.blockSize;
            const xDepth = Math.abs(block.x) / Math.max(Math.abs(bounds.minX), Math.abs(bounds.maxX), 1);
            const opacity = 1 - (xDepth * 0.3); // Blocks further from X=0 are slightly transparent
            this.draw2DBlock(z, y, block.material, block.x === 0 && block.y === 0 && block.z === 0, opacity, `X=${block.x}`);
        });
        
        this.drawLegend(bounds, blocks.length, 'Side View (Z-Y)');
    }
    
    /**
     * Draw a 2D block
     */
    draw2DBlock(x, y, material, isSpawnPoint, opacity = 1, label = '') {
        const size = this.blockSize;
        const color = this.blockColors[material] || '#808080';
        
        // Shadow
        this.ctx.fillStyle = `rgba(0, 0, 0, ${0.2 * opacity})`;
        this.ctx.fillRect(x + 2, y + 2, size, size);
        
        // Block background
        if (color.includes('rgba')) {
            this.ctx.fillStyle = color;
        } else {
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = opacity;
        }
        this.ctx.fillRect(x, y, size, size);
        this.ctx.globalAlpha = 1;
        
        // Border
        this.ctx.strokeStyle = isSpawnPoint ? '#ef4444' : 'rgba(0, 0, 0, 0.4)';
        this.ctx.lineWidth = isSpawnPoint ? 3 : 2;
        this.ctx.strokeRect(x, y, size, size);
        
        // Highlight (top-left lighter edge)
        this.ctx.fillStyle = `rgba(255, 255, 255, ${0.2 * opacity})`;
        this.ctx.fillRect(x, y, size, 3);
        this.ctx.fillRect(x, y, 3, size);
        
        // Shadow (bottom-right darker edge)
        this.ctx.fillStyle = `rgba(0, 0, 0, ${0.2 * opacity})`;
        this.ctx.fillRect(x, y + size - 3, size, 3);
        this.ctx.fillRect(x + size - 3, y, 3, size);
        
        // Spawn point marker
        if (isSpawnPoint) {
            this.ctx.fillStyle = '#ef4444';
            this.ctx.font = 'bold 16px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('⊕', x + size / 2, y + size / 2);
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'alphabetic';
        } else if (label) {
            // Show coordinate label on block
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.font = 'bold 9px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(label, x + size / 2, y + size / 2);
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'alphabetic';
        }
    }
    
    /**
     * Draw background grid
     */
    drawBackground(width, height) {
        // Dark gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(0.5, '#1e293b');
        gradient.addColorStop(1, '#0f172a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);
        
        // Add subtle grid pattern
        this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.05)';
        this.ctx.lineWidth = 1;
        const gridSpacing = 20;
        
        // Vertical lines
        for (let x = 0; x < width; x += gridSpacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < height; y += gridSpacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
        
        // Grid lines
        this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x < width; x += this.blockSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < height; y += this.blockSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
    }
    
    /**
     * Draw a single block
     */
    drawBlock(x, y, material, isSpawnPoint = false) {
        const size = this.blockSize;
        const color = this.blockColors[material] || '#808080';
        
        // Draw block shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x + 2, y + 2, size, size);
        
        // Draw block
        if (color === 'transparent') {
            // Draw air block outline
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.setLineDash([4, 4]);
            this.ctx.strokeRect(x, y, size, size);
            this.ctx.setLineDash([]);
        } else {
            // Solid block
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, size, size);
            
            // Block outline
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, size, size);
            
            // Highlight effect (top-left lighter)
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(x, y, size, size / 4);
            
            // Spawn point indicator
            if (isSpawnPoint) {
                this.ctx.fillStyle = 'rgba(139, 92, 246, 0.4)';
                this.ctx.fillRect(x, y, size, size);
                
                // Draw spawn icon
                this.ctx.fillStyle = '#8b5cf6';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('⭐', x + size / 2, y + size / 2);
            }
        }
        
        // Material label (abbreviated)
        const label = material.replace(/_/g, ' ').substring(0, 8);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '9px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(label, x + size / 2, y + size - 12);
    }
    
    /**
     * Draw legend/info
     */
    drawLegend(bounds, blockCount, viewName = '') {
        const legendY = this.canvas.height - 30;
        
        this.ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
        this.ctx.fillRect(10, legendY - 5, this.canvas.width - 20, 35);
        
        this.ctx.fillStyle = '#a78bfa';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.textAlign = 'left';
        
        const info = [
            viewName,
            `Blocks: ${blockCount}`,
            `Size: ${bounds.width}x${bounds.height}x${bounds.depth}`,
            `⊕ = Spawn Point (0,0,0)`
        ].filter(Boolean).join('  •  ');
        
        this.ctx.fillText(info, 20, legendY + 5);
    }
    
    /**
     * Render empty state
     */
    renderEmptyState() {
        this.canvas.width = 400;
        this.canvas.height = 300;
        
        this.ctx.clearRect(0, 0, 400, 300);
        
        // Background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#0f0f1e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, 400, 300);
        
        // Empty message
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🗿', 200, 120);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '16px sans-serif';
        this.ctx.fillText('No totem pattern defined', 200, 180);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.font = '12px sans-serif';
        this.ctx.fillText('Add pattern blocks to see preview', 200, 210);
    }
}

window.TotemRenderer = TotemRenderer;
