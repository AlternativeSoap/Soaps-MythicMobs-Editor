/**
 * Minecraft Banner Patterns Data
 * All available banner patterns for banners and shields
 */

const BANNER_PATTERNS = [
    // Base Patterns
    { id: 'BASE', name: 'Base', code: 'b', description: 'Fully colored base' },
    { id: 'SQUARE_BOTTOM_LEFT', name: 'Square Bottom Left', code: 'bl', description: 'Bottom left square' },
    { id: 'SQUARE_BOTTOM_RIGHT', name: 'Square Bottom Right', code: 'br', description: 'Bottom right square' },
    { id: 'SQUARE_TOP_LEFT', name: 'Square Top Left', code: 'tl', description: 'Top left square' },
    { id: 'SQUARE_TOP_RIGHT', name: 'Square Top Right', code: 'tr', description: 'Top right square' },
    
    // Stripe Patterns
    { id: 'STRIPE_BOTTOM', name: 'Stripe Bottom', code: 'bs', description: 'Horizontal bottom stripe' },
    { id: 'STRIPE_TOP', name: 'Stripe Top', code: 'ts', description: 'Horizontal top stripe' },
    { id: 'STRIPE_LEFT', name: 'Stripe Left', code: 'ls', description: 'Vertical left stripe' },
    { id: 'STRIPE_RIGHT', name: 'Stripe Right', code: 'rs', description: 'Vertical right stripe' },
    { id: 'STRIPE_CENTER', name: 'Stripe Center', code: 'cs', description: 'Vertical center stripe' },
    { id: 'STRIPE_MIDDLE', name: 'Stripe Middle', code: 'ms', description: 'Horizontal middle stripe' },
    { id: 'STRIPE_DOWNRIGHT', name: 'Stripe Downright', code: 'drs', description: 'Diagonal stripe (top-left to bottom-right)' },
    { id: 'STRIPE_DOWNLEFT', name: 'Stripe Downleft', code: 'dls', description: 'Diagonal stripe (top-right to bottom-left)' },
    
    // Special Patterns
    { id: 'SMALL_STRIPES', name: 'Small Stripes', code: 'ss', description: 'Small vertical stripes' },
    { id: 'CROSS', name: 'Cross', code: 'cr', description: 'Vertical and horizontal cross' },
    { id: 'STRAIGHT_CROSS', name: 'Straight Cross', code: 'sc', description: 'Centered cross' },
    { id: 'TRIANGLE_BOTTOM', name: 'Triangle Bottom', code: 'bt', description: 'Triangle at bottom' },
    { id: 'TRIANGLE_TOP', name: 'Triangle Top', code: 'tt', description: 'Triangle at top' },
    { id: 'TRIANGLES_BOTTOM', name: 'Triangles Bottom', code: 'bts', description: 'Sawtooth pattern at bottom' },
    { id: 'TRIANGLES_TOP', name: 'Triangles Top', code: 'tts', description: 'Sawtooth pattern at top' },
    { id: 'DIAGONAL_LEFT', name: 'Diagonal Left', code: 'ld', description: 'Left half diagonal' },
    { id: 'DIAGONAL_UP_RIGHT', name: 'Diagonal Up Right', code: 'rd', description: 'Right half diagonal' },
    { id: 'DIAGONAL_UP_LEFT', name: 'Diagonal Up Left', code: 'lud', description: 'Top-left triangle' },
    { id: 'DIAGONAL_RIGHT', name: 'Diagonal Right', code: 'rud', description: 'Top-right triangle' },
    { id: 'CIRCLE', name: 'Circle', code: 'mc', description: 'Circle in center' },
    { id: 'RHOMBUS', name: 'Rhombus', code: 'mr', description: 'Diamond shape' },
    { id: 'HALF_VERTICAL', name: 'Half Vertical', code: 'vh', description: 'Vertical half (left)' },
    { id: 'HALF_HORIZONTAL', name: 'Half Horizontal', code: 'hh', description: 'Horizontal half (top)' },
    { id: 'HALF_VERTICAL_RIGHT', name: 'Half Vertical Right', code: 'vhr', description: 'Vertical half (right)' },
    { id: 'HALF_HORIZONTAL_BOTTOM', name: 'Half Horizontal Bottom', code: 'hhb', description: 'Horizontal half (bottom)' },
    
    // Border Patterns
    { id: 'BORDER', name: 'Border', code: 'bo', description: 'Square border' },
    { id: 'CURLY_BORDER', name: 'Curly Border', code: 'cbo', description: 'Decorative border' },
    { id: 'GRADIENT', name: 'Gradient', code: 'gra', description: 'Vertical gradient' },
    { id: 'GRADIENT_UP', name: 'Gradient Up', code: 'gru', description: 'Upward gradient' },
    { id: 'BRICKS', name: 'Bricks', code: 'bri', description: 'Brick pattern' },
    
    // Special Mob Patterns (requires pattern item)
    { id: 'CREEPER', name: 'Creeper', code: 'cre', description: 'Creeper face', requiresItem: true },
    { id: 'SKULL', name: 'Skull', code: 'sku', description: 'Skull and crossbones', requiresItem: true },
    { id: 'FLOWER', name: 'Flower', code: 'flo', description: 'Flower charge', requiresItem: true },
    { id: 'MOJANG', name: 'Mojang', code: 'moj', description: 'Mojang logo', requiresItem: true },
    { id: 'GLOBE', name: 'Globe', code: 'glb', description: 'Globe', requiresItem: true },
    { id: 'PIGLIN', name: 'Piglin', code: 'pig', description: 'Piglin', requiresItem: true },
    { id: 'FLOW', name: 'Flow', code: 'flw', description: 'Flow pattern (1.21+)', requiresItem: true },
    { id: 'GUSTER', name: 'Guster', code: 'gus', description: 'Guster pattern (1.21+)', requiresItem: true }
];

const BANNER_COLORS = [
    'WHITE', 'ORANGE', 'MAGENTA', 'LIGHT_BLUE', 'YELLOW', 'LIME',
    'PINK', 'GRAY', 'LIGHT_GRAY', 'CYAN', 'PURPLE', 'BLUE',
    'BROWN', 'GREEN', 'RED', 'BLACK'
];

window.BannerPatternData = {
    BANNER_PATTERNS,
    BANNER_COLORS,
    
    /**
     * Get pattern by ID
     */
    getPattern(id) {
        return BANNER_PATTERNS.find(p => p.id === id);
    },
    
    /**
     * Get patterns that require special items
     */
    getSpecialPatterns() {
        return BANNER_PATTERNS.filter(p => p.requiresItem);
    },
    
    /**
     * Get basic patterns (no special item required)
     */
    getBasicPatterns() {
        return BANNER_PATTERNS.filter(p => !p.requiresItem);
    }
};

console.log('✅ Banner Patterns loaded:', BANNER_PATTERNS.length, 'patterns');
