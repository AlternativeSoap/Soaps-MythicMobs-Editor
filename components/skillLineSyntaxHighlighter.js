/**
 * SkillLineSyntaxHighlighter - Syntax highlighting for skill lines
 * 
 * Features:
 * - Color-coded mechanics (different colors for different mechanic types)
 * - Highlighted attributes with key-value pairs
 * - Distinct colors for targeters, triggers, conditions
 * - Numeric value highlighting
 * - String literal highlighting
 */

class SkillLineSyntaxHighlighter {
    constructor() {
        // Mechanic color categories
        this.mechanicCategories = {
            damage: ['damage', 'ignite', 'throw', 'explosion', 'strike', 'shoot', 'projectile'],
            effect: ['potion', 'effect', 'removeeffect', 'heal', 'feed', 'oxygen'],
            particle: ['particles', 'particleline', 'particletornado', 'particlebox', 'particlesphere'],
            sound: ['sound', 'playsound', 'stopsound'],
            movement: ['teleport', 'velocity', 'leap', 'pull', 'push', 'mount', 'dismount'],
            spawn: ['summon', 'spawn', 'consumeslot'],
            control: ['skill', 'metaskill', 'message', 'command', 'delay', 'cast'],
            modify: ['setlevel', 'sethealth', 'modifyscore', 'setname', 'setblock'],
            condition: ['oncondition', 'entitycondition', 'locationcondition']
        };
        
        // Color scheme
        this.colors = {
            mechanicDamage: '#ef4444',      // Red
            mechanicEffect: '#10b981',       // Green
            mechanicParticle: '#a78bfa',     // Purple
            mechanicSound: '#fbbf24',        // Yellow
            mechanicMovement: '#3b82f6',     // Blue
            mechanicSpawn: '#f59e0b',        // Orange
            mechanicControl: '#ec4899',      // Pink
            mechanicModify: '#06b6d4',       // Cyan
            mechanicCondition: '#8b5cf6',    // Violet
            mechanicDefault: '#d1d5db',      // Gray
            
            attribute: '#a78bfa',            // Purple
            attributeKey: '#60a5fa',         // Light blue
            attributeValue: '#34d399',       // Emerald
            
            targeter: '#f59e0b',             // Orange
            trigger: '#ec4899',              // Pink
            condition: '#fbbf24',            // Yellow
            
            number: '#a78bfa',               // Purple
            string: '#10b981',               // Green
            operator: '#9ca3af',             // Gray
            bracket: '#6b7280',              // Dark gray
            
            comment: '#6b7280'               // Dark gray
        };
    }
    
    /**
     * Highlight a skill line
     * @param {string} line - Raw skill line text
     * @returns {string} HTML with syntax highlighting
     */
    highlight(line) {
        if (!line || line.trim() === '') {
            return this.escapeHtml(line);
        }
        
        const trimmed = line.trim();
        
        // Handle comments
        if (trimmed.startsWith('#')) {
            return `<span class="hl-comment">${this.escapeHtml(line)}</span>`;
        }
        
        // Handle YAML key-value pairs (not mechanics)
        if (trimmed.includes(':') && !trimmed.startsWith('-')) {
            return this.highlightYamlKeyValue(line);
        }
        
        // Handle mechanic lines
        if (trimmed.startsWith('-')) {
            return this.highlightMechanicLine(line);
        }
        
        return this.escapeHtml(line);
    }
    
    /**
     * Highlight a YAML key-value line
     * @param {string} line - YAML line
     * @returns {string} Highlighted HTML
     */
    highlightYamlKeyValue(line) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        
        if (!value) {
            // Just a key (like Skills:)
            return `<span class="hl-key">${this.escapeHtml(key)}</span><span class="hl-operator">:</span>`;
        }
        
        // Key with value
        return `<span class="hl-key">${this.escapeHtml(key)}</span><span class="hl-operator">:</span> <span class="hl-value">${this.escapeHtml(value)}</span>`;
    }
    
    /**
     * Highlight a mechanic line (- mechanic{attrs} @targeter ~trigger ?condition)
     * @param {string} line - Mechanic line
     * @returns {string} Highlighted HTML
     */
    highlightMechanicLine(line) {
        let result = '';
        let i = 0;
        
        // Skip leading whitespace
        while (i < line.length && /\s/.test(line[i])) {
            result += line[i];
            i++;
        }
        
        // Dash
        if (line[i] === '-') {
            result += '<span class="hl-operator">-</span> ';
            i++;
            
            // Skip space after dash
            while (i < line.length && /\s/.test(line[i])) {
                i++;
            }
        }
        
        // Extract mechanic name
        let mechanicName = '';
        while (i < line.length && !/[\s{@~?]/.test(line[i])) {
            mechanicName += line[i];
            i++;
        }
        
        if (mechanicName) {
            const category = this.getMechanicCategory(mechanicName);
            result += `<span class="hl-mechanic hl-mechanic-${category}">${this.escapeHtml(mechanicName)}</span>`;
        }
        
        // Parse rest of line
        while (i < line.length) {
            const char = line[i];
            
            if (char === '{') {
                // Attributes block
                const attributesStart = i;
                let depth = 1;
                i++;
                
                while (i < line.length && depth > 0) {
                    if (line[i] === '{') depth++;
                    if (line[i] === '}') depth--;
                    i++;
                }
                
                const attributesBlock = line.substring(attributesStart, i);
                result += this.highlightAttributes(attributesBlock);
            } else if (char === '@') {
                // Targeter
                let targeter = '@';
                i++;
                while (i < line.length && !/[\s~?]/.test(line[i])) {
                    targeter += line[i];
                    i++;
                }
                result += `<span class="hl-targeter">${this.escapeHtml(targeter)}</span>`;
            } else if (char === '~') {
                // Trigger
                let trigger = '~';
                i++;
                while (i < line.length && !/[\s?]/.test(line[i])) {
                    trigger += line[i];
                    i++;
                }
                result += `<span class="hl-trigger">${this.escapeHtml(trigger)}</span>`;
            } else if (char === '?') {
                // Condition
                let condition = '?';
                i++;
                while (i < line.length && !/\s/.test(line[i])) {
                    condition += line[i];
                    i++;
                }
                result += `<span class="hl-condition">${this.escapeHtml(condition)}</span>`;
            } else if (/\d/.test(char)) {
                // Number (could be chance or health modifier at end)
                let number = '';
                while (i < line.length && /[\d.]/.test(line[i])) {
                    number += line[i];
                    i++;
                }
                result += `<span class="hl-number">${number}</span>`;
            } else {
                result += this.escapeHtml(char);
                i++;
            }
        }
        
        return result;
    }
    
    /**
     * Highlight attributes block {key1=value1;key2=value2}
     * @param {string} block - Attributes block with braces
     * @returns {string} Highlighted HTML
     */
    highlightAttributes(block) {
        if (!block || block.length < 2) {
            return this.escapeHtml(block);
        }
        
        let result = '<span class="hl-bracket">{</span>';
        
        // Remove outer braces
        const inner = block.substring(1, block.length - 1);
        
        // Parse attributes
        let i = 0;
        let inQuotes = false;
        let quoteChar = '';
        
        while (i < inner.length) {
            const char = inner[i];
            
            if ((char === '"' || char === "'") && (i === 0 || inner[i - 1] !== '\\')) {
                if (!inQuotes) {
                    inQuotes = true;
                    quoteChar = char;
                    result += `<span class="hl-string">${char}`;
                } else if (char === quoteChar) {
                    inQuotes = false;
                    result += `${char}</span>`;
                } else {
                    result += char;
                }
                i++;
            } else if (!inQuotes && char === '=') {
                // Equal sign (operator)
                result += '<span class="hl-operator">=</span>';
                i++;
            } else if (!inQuotes && char === ';') {
                // Semicolon (separator)
                result += '<span class="hl-operator">;</span>';
                i++;
            } else if (!inQuotes && /\d/.test(char)) {
                // Number
                let number = '';
                while (i < inner.length && /[\d.]/.test(inner[i])) {
                    number += inner[i];
                    i++;
                }
                result += `<span class="hl-number">${number}</span>`;
            } else if (inQuotes) {
                result += this.escapeHtml(char);
                i++;
            } else {
                // Check if this is an attribute key
                const remainingBeforeEquals = this.getUntilChar(inner.substring(i), '=');
                const remainingBeforeSemicolon = this.getUntilChar(inner.substring(i), ';');
                
                if (remainingBeforeEquals.length > 0 && remainingBeforeEquals.length < remainingBeforeSemicolon.length) {
                    // This is a key
                    result += `<span class="hl-attr-key">${this.escapeHtml(remainingBeforeEquals)}</span>`;
                    i += remainingBeforeEquals.length;
                } else {
                    result += this.escapeHtml(char);
                    i++;
                }
            }
        }
        
        // Close any unclosed string
        if (inQuotes) {
            result += '</span>';
        }
        
        result += '<span class="hl-bracket">}</span>';
        return result;
    }
    
    /**
     * Get characters until a specific character
     * @param {string} str - String to search
     * @param {string} char - Character to find
     * @returns {string} Substring until char
     */
    getUntilChar(str, char) {
        const index = str.indexOf(char);
        if (index === -1) return str;
        return str.substring(0, index).trim();
    }
    
    /**
     * Get mechanic category for color coding
     * @param {string} mechanicName - Name of mechanic
     * @returns {string} Category name
     */
    getMechanicCategory(mechanicName) {
        const lower = mechanicName.toLowerCase();
        
        for (const [category, mechanics] of Object.entries(this.mechanicCategories)) {
            if (mechanics.some(m => lower.includes(m))) {
                return category;
            }
        }
        
        return 'default';
    }
    
    /**
     * Escape HTML characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Get color for a mechanic category
     * @param {string} category - Mechanic category
     * @returns {string} Color hex code
     */
    getCategoryColor(category) {
        const key = `mechanic${category.charAt(0).toUpperCase() + category.slice(1)}`;
        return this.colors[key] || this.colors.mechanicDefault;
    }
    
    /**
     * Highlight multiple lines
     * @param {Array} lines - Array of skill lines
     * @returns {Array} Array of highlighted HTML strings
     */
    highlightLines(lines) {
        return lines.map(line => this.highlight(line));
    }
}

// Create global instance
window.SkillLineSyntaxHighlighter = SkillLineSyntaxHighlighter;
