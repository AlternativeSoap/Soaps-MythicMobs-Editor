/**
 * Minecraft Banner Renderer
 * Renders accurate Minecraft banners using Canvas API
 */

class BannerRenderer {
    constructor(canvasId) {
        console.log('🎨 BannerRenderer constructor called with canvasId:', canvasId);
        this.canvas = document.getElementById(canvasId);
        
        if (!this.canvas) {
            console.error('❌ Canvas element not found:', canvasId);
            return;
        }
        
        console.log('✅ Canvas element found:', this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('❌ Could not get 2D context from canvas');
            return;
        }
        
        this.width = 140;
        this.height = 200;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        console.log('✅ Canvas configured:', this.width, 'x', this.height);
        
        // Minecraft color mapping (dye colors to RGB)
        this.colors = {
            'WHITE': '#F9FFFE',
            'ORANGE': '#F9801D',
            'MAGENTA': '#C74EBD',
            'LIGHT_BLUE': '#3AB3DA',
            'YELLOW': '#FED83D',
            'LIME': '#80C71F',
            'PINK': '#F38BAA',
            'GRAY': '#474F52',
            'LIGHT_GRAY': '#9D9D97',
            'CYAN': '#169C9C',
            'PURPLE': '#8932B8',
            'BLUE': '#3C44AA',
            'BROWN': '#835432',
            'GREEN': '#5E7C16',
            'RED': '#B02E26',
            'BLACK': '#1D1D21'
        };
    }
    
    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Add subtle banner shape background
        this.ctx.fillStyle = '#2a2a3e';
        this.ctx.fillRect(10, 10, 120, 180);
        
        // Add banner pole
        this.ctx.fillStyle = '#8B7355';
        this.ctx.fillRect(5, 10, 8, 180);
    }
    
    /**
     * Render complete banner with layers
     */
    renderBanner(layers) {
        console.log('🎨 renderBanner called with', layers?.length || 0, 'layers:', layers);
        
        if (!this.ctx) {
            console.error('❌ No canvas context available for rendering');
            return;
        }
        
        this.clear();
        
        if (!layers || layers.length === 0) {
            console.log('📝 No layers, drawing empty white banner');
            // Draw empty banner
            this.ctx.fillStyle = '#FFFFFF';
            this.drawBannerShape();
            return;
        }
        
        // Render each layer
        layers.forEach((layer, index) => {
            console.log(`  Layer ${index + 1}:`, layer);
            const parts = layer.split(' ');
            const color = parts[0] || 'WHITE';
            const pattern = parts[1] || 'BASE';
            
            this.renderLayer(color, pattern);
        });
        
        console.log('✅ Banner rendering complete');
    }
    
    /**
     * Draw basic banner shape
     */
    drawBannerShape() {
        const x = 10;
        const y = 10;
        const w = 120;
        const h = 160;
        
        // Main rectangle
        this.ctx.fillRect(x, y, w, h);
        
        // Bottom triangular cuts (banner wave)
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + h);
        this.ctx.lineTo(x + w/2, y + h + 20);
        this.ctx.lineTo(x + w, y + h);
        this.ctx.fill();
    }
    
    /**
     * Render a single layer with pattern
     */
    renderLayer(color, patternId) {
        const rgb = this.colors[color] || this.colors['WHITE'];
        this.ctx.fillStyle = rgb;
        
        // Draw pattern based on type
        this.drawPattern(patternId);
    }
    
    /**
     * Draw specific pattern
     */
    drawPattern(patternId) {
        const x = 10;
        const y = 10;
        const w = 120;
        const h = 160;
        
        switch(patternId) {
            case 'BASE':
                this.drawBannerShape();
                break;
                
            case 'STRIPE_BOTTOM':
                this.ctx.fillRect(x, y + h - 20, w, 20);
                break;
                
            case 'STRIPE_TOP':
                this.ctx.fillRect(x, y, w, 20);
                break;
                
            case 'STRIPE_LEFT':
                this.ctx.fillRect(x, y, 20, h);
                break;
                
            case 'STRIPE_RIGHT':
                this.ctx.fillRect(x + w - 20, y, 20, h);
                break;
                
            case 'STRIPE_CENTER':
                this.ctx.fillRect(x + w/2 - 10, y, 20, h);
                break;
                
            case 'STRIPE_MIDDLE':
                this.ctx.fillRect(x, y + h/2 - 10, w, 20);
                break;
                
            case 'STRIPE_DOWNRIGHT':
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + 30, y);
                this.ctx.lineTo(x + w, y + h);
                this.ctx.lineTo(x + w - 30, y + h);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'STRIPE_DOWNLEFT':
                this.ctx.beginPath();
                this.ctx.moveTo(x + w, y);
                this.ctx.lineTo(x + w - 30, y);
                this.ctx.lineTo(x, y + h);
                this.ctx.lineTo(x + 30, y + h);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'CROSS':
                this.ctx.fillRect(x + w/2 - 10, y, 20, h);
                this.ctx.fillRect(x, y + h/2 - 10, w, 20);
                break;
                
            case 'SQUARE_BOTTOM_LEFT':
                this.ctx.fillRect(x, y + h/2, w/2, h/2);
                break;
                
            case 'SQUARE_BOTTOM_RIGHT':
                this.ctx.fillRect(x + w/2, y + h/2, w/2, h/2);
                break;
                
            case 'SQUARE_TOP_LEFT':
                this.ctx.fillRect(x, y, w/2, h/2);
                break;
                
            case 'SQUARE_TOP_RIGHT':
                this.ctx.fillRect(x + w/2, y, w/2, h/2);
                break;
                
            case 'TRIANGLE_BOTTOM':
                this.ctx.beginPath();
                this.ctx.moveTo(x, y + h);
                this.ctx.lineTo(x + w/2, y + h/2);
                this.ctx.lineTo(x + w, y + h);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'TRIANGLE_TOP':
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + w/2, y + h/2);
                this.ctx.lineTo(x + w, y);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'CIRCLE':
                this.ctx.beginPath();
                this.ctx.arc(x + w/2, y + h/2, 30, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'RHOMBUS':
                this.ctx.beginPath();
                this.ctx.moveTo(x + w/2, y + 20);
                this.ctx.lineTo(x + w - 20, y + h/2);
                this.ctx.lineTo(x + w/2, y + h - 20);
                this.ctx.lineTo(x + 20, y + h/2);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'HALF_VERTICAL':
                this.ctx.fillRect(x, y, w/2, h);
                break;
                
            case 'HALF_VERTICAL_RIGHT':
                this.ctx.fillRect(x + w/2, y, w/2, h);
                break;
                
            case 'HALF_HORIZONTAL':
                this.ctx.fillRect(x, y, w, h/2);
                break;
                
            case 'HALF_HORIZONTAL_BOTTOM':
                this.ctx.fillRect(x, y + h/2, w, h/2);
                break;
                
            case 'BORDER':
                this.ctx.fillRect(x, y, w, 15);
                this.ctx.fillRect(x, y + h - 15, w, 15);
                this.ctx.fillRect(x, y, 15, h);
                this.ctx.fillRect(x + w - 15, y, 15, h);
                break;
                
            case 'GRADIENT':
                const gradient = this.ctx.createLinearGradient(x, y, x, y + h);
                gradient.addColorStop(0, this.ctx.fillStyle);
                gradient.addColorStop(1, 'rgba(0,0,0,0)');
                this.ctx.fillStyle = gradient;
                this.drawBannerShape();
                break;
                
            case 'GRADIENT_UP':
                const gradientUp = this.ctx.createLinearGradient(x, y + h, x, y);
                gradientUp.addColorStop(0, this.ctx.fillStyle);
                gradientUp.addColorStop(1, 'rgba(0,0,0,0)');
                this.ctx.fillStyle = gradientUp;
                this.drawBannerShape();
                break;
                
            default:
                // For unknown patterns, just fill the whole banner
                this.drawBannerShape();
                break;
        }
    }
}

window.BannerRenderer = BannerRenderer;
