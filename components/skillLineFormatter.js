/**
 * SkillLineFormatter - Auto-format skill lines with standardization
 * 
 * Features:
 * - Standardize spacing and indentation
 * - Sort attributes alphabetically
 * - Normalize brackets and quotes
 * - Fix common formatting issues
 * - Batch format operations
 */

class SkillLineFormatter {
    constructor() {
        this.formatOptions = {
            sortAttributes: true,
            standardizeSpacing: true,
            normalizeBrackets: true,
            indentSize: 2,
            maxLineLength: 120
        };
        
        // Common attribute order (will be sorted, but these have priority)
        this.attributePriority = [
            'id', 'type', 'skill', 'mechanic', 'trigger', 'targeter',
            'amount', 'damage', 'duration', 'chance', 'cooldown',
            'conditions', 'targetConditions', 'onTick', 'onHit', 'onEnd'
        ];
    }
    
    /**
     * Format a single skill line
     * @param {string} line - The line to format
     * @param {number} indentLevel - Current indentation level
     * @returns {string} Formatted line
     */
    formatLine(line, indentLevel = 0) {
        if (!line || line.trim() === '') return line;
        
        const trimmed = line.trim();
        
        // Don't format comments
        if (trimmed.startsWith('#')) {
            return this.indentLine(trimmed, indentLevel);
        }
        
        // Handle YAML key-value pairs
        if (trimmed.includes(':')) {
            return this.formatKeyValue(trimmed, indentLevel);
        }
        
        // Handle mechanic/skill lines
        if (trimmed.startsWith('-')) {
            return this.formatMechanicLine(trimmed, indentLevel);
        }
        
        return this.indentLine(trimmed, indentLevel);
    }
    
    /**
     * Format a key-value line
     * @param {string} line - The line to format
     * @param {number} indentLevel - Current indentation level
     * @returns {string} Formatted line
     */
    formatKeyValue(line, indentLevel) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        
        if (!value) {
            // Just a key (like Skills:)
            return this.indentLine(`${key.trim()}:`, indentLevel);
        }
        
        // Key with value
        return this.indentLine(`${key.trim()}: ${value}`, indentLevel);
    }
    
    /**
     * Format a mechanic/skill line (- mechanicName{...})
     * @param {string} line - The line to format
     * @param {number} indentLevel - Current indentation level
     * @returns {string} Formatted line
     */
    formatMechanicLine(line, indentLevel) {
        // Extract mechanic name and attributes
        const match = line.match(/^-\s*([^\s{]+)(?:\{([^}]*)\})?(?:\s+@\w+)?(?:\s+~\w+)?/);
        
        if (!match) {
            return this.indentLine(line, indentLevel);
        }
        
        const mechanicName = match[1];
        const attributesStr = match[2] || '';
        
        // Parse attributes
        const attributes = this.parseAttributes(attributesStr);
        
        // Format attributes
        const formattedAttributes = this.formatAttributes(attributes);
        
        // Rebuild line
        let result = mechanicName;
        
        if (formattedAttributes) {
            result += `{${formattedAttributes}}`;
        }
        
        // Add back targeter/trigger if present
        const targeterMatch = line.match(/@(\w+)/);
        if (targeterMatch) {
            result += ` @${targeterMatch[1]}`;
        }
        
        const triggerMatch = line.match(/~(\w+)/);
        if (triggerMatch) {
            result += ` ~${triggerMatch[1]}`;
        }
        
        return this.indentLine(result, indentLevel);
    }
    
    /**
     * Parse attributes string into key-value pairs
     * @param {string} attributesStr - String like "amount=10;duration=20"
     * @returns {Object} Parsed attributes
     */
    parseAttributes(attributesStr) {
        const attributes = {};
        
        if (!attributesStr || !attributesStr.trim()) {
            return attributes;
        }
        
        // Split by semicolon, but respect quotes
        const parts = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < attributesStr.length; i++) {
            const char = attributesStr[i];
            
            if (char === '"' || char === "'") {
                inQuotes = !inQuotes;
                current += char;
            } else if (char === ';' && !inQuotes) {
                if (current.trim()) {
                    parts.push(current.trim());
                }
                current = '';
            } else {
                current += char;
            }
        }
        
        if (current.trim()) {
            parts.push(current.trim());
        }
        
        // Parse each part
        parts.forEach(part => {
            const [key, ...valueParts] = part.split('=');
            if (key && valueParts.length > 0) {
                attributes[key.trim()] = valueParts.join('=').trim();
            }
        });
        
        return attributes;
    }
    
    /**
     * Format attributes object into string
     * @param {Object} attributes - Attributes to format
     * @returns {string} Formatted attribute string
     */
    formatAttributes(attributes) {
        const keys = Object.keys(attributes);
        
        if (keys.length === 0) {
            return '';
        }
        
        // Sort attributes
        const sortedKeys = this.formatOptions.sortAttributes 
            ? this.sortAttributeKeys(keys)
            : keys;
        
        // Build attribute string
        const parts = sortedKeys.map(key => {
            const value = attributes[key];
            
            // Normalize spacing
            const normalizedValue = this.normalizeValue(value);
            
            return `${key}=${normalizedValue}`;
        });
        
        return parts.join(';');
    }
    
    /**
     * Sort attribute keys by priority and alphabetically
     * @param {string[]} keys - Attribute keys to sort
     * @returns {string[]} Sorted keys
     */
    sortAttributeKeys(keys) {
        return keys.sort((a, b) => {
            const priorityA = this.attributePriority.indexOf(a);
            const priorityB = this.attributePriority.indexOf(b);
            
            // Both have priority - sort by priority
            if (priorityA !== -1 && priorityB !== -1) {
                return priorityA - priorityB;
            }
            
            // Only A has priority - A comes first
            if (priorityA !== -1) return -1;
            
            // Only B has priority - B comes first
            if (priorityB !== -1) return 1;
            
            // Neither has priority - sort alphabetically
            return a.localeCompare(b);
        });
    }
    
    /**
     * Normalize attribute value
     * @param {string} value - Value to normalize
     * @returns {string} Normalized value
     */
    normalizeValue(value) {
        if (!value) return value;
        
        const trimmed = value.trim();
        
        // Normalize quotes (prefer double quotes)
        if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
            return `"${trimmed.slice(1, -1)}"`;
        }
        
        // Normalize spacing in lists
        if (trimmed.includes(',')) {
            const parts = trimmed.split(',').map(p => p.trim());
            return parts.join(',');
        }
        
        return trimmed;
    }
    
    /**
     * Add indentation to a line
     * @param {string} line - Line to indent
     * @param {number} level - Indentation level
     * @returns {string} Indented line
     */
    indentLine(line, level) {
        if (level === 0) return line;
        
        const spaces = ' '.repeat(level * this.formatOptions.indentSize);
        return `${spaces}${line}`;
    }
    
    /**
     * Format multiple lines
     * @param {string[]} lines - Array of lines to format
     * @returns {string[]} Formatted lines
     */
    formatLines(lines) {
        const formatted = [];
        let currentIndent = 0;
        
        lines.forEach(line => {
            const trimmed = line.trim();
            
            if (!trimmed) {
                formatted.push('');
                return;
            }
            
            // Detect indentation changes
            const indent = this.detectIndentation(line, trimmed);
            currentIndent = Math.max(0, currentIndent + indent);
            
            // Format the line
            const formattedLine = this.formatLine(trimmed, currentIndent);
            formatted.push(formattedLine);
            
            // Adjust indent for next line
            if (trimmed.endsWith(':') && !trimmed.startsWith('#')) {
                currentIndent++;
            }
        });
        
        return formatted;
    }
    
    /**
     * Detect indentation change
     * @param {string} originalLine - Original line with spacing
     * @param {string} trimmedLine - Trimmed line
     * @returns {number} Indentation change (-1, 0, or 1)
     */
    detectIndentation(originalLine, trimmedLine) {
        // If line starts with -, it's at the same or lower level
        if (trimmedLine.startsWith('-')) {
            // Check if previous context suggests it should be indented
            const leadingSpaces = originalLine.length - originalLine.trimStart().length;
            return leadingSpaces > 0 ? 0 : -1;
        }
        
        // If line is a key:, it might start a new section
        if (trimmedLine.endsWith(':') && !trimmedLine.startsWith('#')) {
            return -1; // Reset to lower level
        }
        
        return 0;
    }
    
    /**
     * Format entire skill file
     * @param {string} content - File content
     * @returns {string} Formatted content
     */
    formatFile(content) {
        const lines = content.split('\n');
        const formatted = this.formatLines(lines);
        return formatted.join('\n');
    }
    
    /**
     * Batch format multiple skill lines
     * @param {Array} skillLines - Array of skill line objects
     * @returns {Array} Formatted skill line objects
     */
    batchFormat(skillLines) {
        return skillLines.map(lineObj => {
            if (lineObj.raw) {
                const formatted = this.formatLine(lineObj.raw);
                return {
                    ...lineObj,
                    raw: formatted,
                    formatted: formatted
                };
            }
            return lineObj;
        });
    }
    
    /**
     * Fix common formatting issues
     * @param {string} line - Line to fix
     * @returns {Object} Fixed line and issues found
     */
    fixCommonIssues(line) {
        const issues = [];
        let fixed = line;
        
        // Fix multiple spaces
        if (/\s{2,}/.test(fixed)) {
            fixed = fixed.replace(/\s{2,}/g, ' ');
            issues.push('Multiple consecutive spaces');
        }
        
        // Fix spacing around equals
        if (/=\s+/.test(fixed) || /\s+=/.test(fixed)) {
            fixed = fixed.replace(/\s*=\s*/g, '=');
            issues.push('Inconsistent spacing around equals');
        }
        
        // Fix spacing around semicolons
        if (/;\s{2,}/.test(fixed) || /\s+;/.test(fixed)) {
            fixed = fixed.replace(/\s*;\s*/g, ';');
            issues.push('Inconsistent spacing around semicolons');
        }
        
        // Fix mismatched quotes
        const singleQuotes = (fixed.match(/'/g) || []).length;
        const doubleQuotes = (fixed.match(/"/g) || []).length;
        
        if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
            issues.push('Mismatched quotes');
        }
        
        // Fix mismatched brackets
        const openBrackets = (fixed.match(/\{/g) || []).length;
        const closeBrackets = (fixed.match(/\}/g) || []).length;
        
        if (openBrackets !== closeBrackets) {
            issues.push('Mismatched brackets');
        }
        
        return { fixed, issues };
    }
    
    /**
     * Get formatting suggestions for a line
     * @param {string} line - Line to analyze
     * @returns {Array} Suggestions
     */
    getSuggestions(line) {
        const suggestions = [];
        
        // Check if attributes could be sorted
        const match = line.match(/\{([^}]+)\}/);
        if (match) {
            const attributes = this.parseAttributes(match[1]);
            const keys = Object.keys(attributes);
            const sortedKeys = this.sortAttributeKeys(keys);
            
            if (JSON.stringify(keys) !== JSON.stringify(sortedKeys)) {
                suggestions.push({
                    type: 'sort',
                    message: 'Attributes can be sorted alphabetically',
                    severity: 'info'
                });
            }
        }
        
        // Check for formatting issues
        const { issues } = this.fixCommonIssues(line);
        issues.forEach(issue => {
            suggestions.push({
                type: 'fix',
                message: issue,
                severity: 'warning'
            });
        });
        
        // Check line length
        if (line.length > this.formatOptions.maxLineLength) {
            suggestions.push({
                type: 'length',
                message: `Line exceeds ${this.formatOptions.maxLineLength} characters`,
                severity: 'info'
            });
        }
        
        return suggestions;
    }
    
    /**
     * Update format options
     * @param {Object} options - New options
     */
    setOptions(options) {
        this.formatOptions = { ...this.formatOptions, ...options };
    }
    
    /**
     * Get current format options
     * @returns {Object} Current options
     */
    getOptions() {
        return { ...this.formatOptions };
    }
}

// Create global instance
window.SkillLineFormatter = SkillLineFormatter;
