/**
 * Skill Line Parser Utility
 * Parses MythicMobs skill line strings into component parts
 * 
 * Format: - mechanic{args} @targeter ~trigger ?condition chance health_modifier
 */

const SkillLineParser = {
    /**
     * Parse a complete skill line string into components
     * @param {string} line - The skill line to parse
     * @returns {Object} Parsed components
     */
    parse(line) {
        if (!line || typeof line !== 'string') {
            return this.emptyResult();
        }

        // Remove leading dash and whitespace
        line = line.trim().replace(/^-\s*/, '');

        const result = {
            original: line,
            mechanic: null,
            mechanicArgs: {},
            targeter: '@Self', // Default
            targeterArgs: {},
            trigger: null,
            conditions: [],
            chance: null,
            healthModifier: null,
            valid: false,
            errors: []
        };

        try {
            // Parse mechanic (required, always first)
            const mechanicMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_:]*)/);
            if (mechanicMatch) {
                result.mechanic = mechanicMatch[1];
                line = line.substring(mechanicMatch[0].length).trim();
            } else {
                result.errors.push('No mechanic found');
                return result;
            }

            // Parse mechanic arguments {arg=value;arg2=value2}
            if (line.startsWith('{')) {
                const argsMatch = this.extractBraces(line);
                if (argsMatch) {
                    result.mechanicArgs = this.parseArguments(argsMatch.content);
                    line = line.substring(argsMatch.endIndex + 1).trim();
                }
            }

            // Parse remaining components (order doesn't matter after mechanic)
            while (line.length > 0) {
                line = line.trim();
                
                // Parse targeter @TargeterName{args}
                if (line.startsWith('@')) {
                    const targeterMatch = line.match(/^@([a-zA-Z_][a-zA-Z0-9_]*)/);
                    if (targeterMatch) {
                        result.targeter = '@' + targeterMatch[1];
                        line = line.substring(targeterMatch[0].length).trim();
                        
                        // Parse targeter arguments
                        if (line.startsWith('{')) {
                            const argsMatch = this.extractBraces(line);
                            if (argsMatch) {
                                result.targeterArgs = this.parseArguments(argsMatch.content);
                                line = line.substring(argsMatch.endIndex + 1).trim();
                            }
                        }
                    }
                }
                // Parse trigger ~triggerName or ~onTimer:100
                else if (line.startsWith('~')) {
                    const triggerMatch = line.match(/^~([a-zA-Z_][a-zA-Z0-9_:]*)/);
                    if (triggerMatch) {
                        result.trigger = '~' + triggerMatch[1];
                        line = line.substring(triggerMatch[0].length).trim();
                    }
                }
                // Parse inline conditions:
                // ?conditionName{args} or ?!conditionName{args} (standard - checks caster)
                // ?~conditionName{args} or ?~!conditionName{args} (trigger - checks trigger entity)
                else if (line.startsWith('?')) {
                    const conditionMatch = line.match(/^\?(!?)(~?)(!?)([a-zA-Z_][a-zA-Z0-9_]*)/);
                    if (conditionMatch) {
                        const isTriggerCondition = conditionMatch[2] === '~';
                        const negated = conditionMatch[1] === '!' || conditionMatch[3] === '!';
                        const conditionName = conditionMatch[4];
                        line = line.substring(conditionMatch[0].length).trim();
                        
                        let conditionArgs = {};
                        if (line.startsWith('{')) {
                            const argsMatch = this.extractBraces(line);
                            if (argsMatch) {
                                conditionArgs = this.parseArguments(argsMatch.content);
                                line = line.substring(argsMatch.endIndex + 1).trim();
                            }
                        }
                        
                        result.conditions.push({
                            name: conditionName,
                            negated: negated,
                            type: isTriggerCondition ? 'trigger' : 'standard',
                            args: conditionArgs
                        });
                    }
                }
                // Parse chance (0.5 or 50%)
                else if (line.match(/^[\d.]+%?/)) {
                    const chanceMatch = line.match(/^([\d.]+%?)/);
                    if (chanceMatch) {
                        result.chance = chanceMatch[1];
                        line = line.substring(chanceMatch[0].length).trim();
                    }
                }
                // Parse health modifier (<50%, >75%, =30%-50%)
                else if (line.match(/^[<>=]/)) {
                    const healthMatch = line.match(/^([<>=][^@~?\s]+)/);
                    if (healthMatch) {
                        result.healthModifier = healthMatch[1];
                        line = line.substring(healthMatch[0].length).trim();
                    }
                }
                // Unknown component - break to avoid infinite loop
                else {
                    // Try to consume one word and continue
                    const unknownMatch = line.match(/^([^\s@~?]+)/);
                    if (unknownMatch) {
                        line = line.substring(unknownMatch[0].length).trim();
                    } else {
                        break;
                    }
                }
            }

            result.valid = result.mechanic !== null;
        } catch (error) {
            result.errors.push('Parse error: ' + error.message);
        }

        return result;
    },

    /**
     * Extract content within braces, handling nested braces
     * @param {string} str - String starting with {
     * @returns {Object|null} {content, endIndex} or null
     */
    extractBraces(str) {
        if (!str.startsWith('{')) return null;
        
        let depth = 0;
        let endIndex = -1;
        
        for (let i = 0; i < str.length; i++) {
            if (str[i] === '{') depth++;
            else if (str[i] === '}') {
                depth--;
                if (depth === 0) {
                    endIndex = i;
                    break;
                }
            }
        }
        
        if (endIndex === -1) return null;
        
        return {
            content: str.substring(1, endIndex),
            endIndex: endIndex
        };
    },

    /**
     * Parse argument string into object
     * @param {string} argsStr - Arguments string (without braces)
     * @returns {Object} Parsed arguments
     */
    parseArguments(argsStr) {
        const args = {};
        if (!argsStr || argsStr.trim() === '') return args;
        
        // Split by semicolon, but respect nested structures
        const parts = this.smartSplit(argsStr, ';');
        
        for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed) continue;
            
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex > 0) {
                const key = trimmed.substring(0, eqIndex).trim();
                const value = trimmed.substring(eqIndex + 1).trim();
                args[key] = value;
            }
        }
        
        return args;
    },

    /**
     * Smart split that respects nested braces
     * @param {string} str - String to split
     * @param {string} delimiter - Split delimiter
     * @returns {Array} Split parts
     */
    smartSplit(str, delimiter) {
        const parts = [];
        let current = '';
        let depth = 0;
        
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            
            if (char === '{') depth++;
            else if (char === '}') depth--;
            else if (char === delimiter && depth === 0) {
                parts.push(current);
                current = '';
                continue;
            }
            
            current += char;
        }
        
        if (current) parts.push(current);
        return parts;
    },

    /**
     * Build a skill line string from components
     * @param {Object} components - Skill line components
     * @returns {string} Formatted skill line
     */
    build(components) {
        let line = '- ' + components.mechanic;
        
        // Add mechanic arguments
        if (components.mechanicArgs && Object.keys(components.mechanicArgs).length > 0) {
            const args = Object.entries(components.mechanicArgs)
                .map(([key, value]) => `${key}=${value}`)
                .join(';');
            line += `{${args}}`;
        }
        
        // Add targeter (only if not default @Self)
        if (components.targeter && components.targeter !== '@Self') {
            line += ' ' + components.targeter;
            
            // Add targeter arguments
            if (components.targeterArgs && Object.keys(components.targeterArgs).length > 0) {
                const args = Object.entries(components.targeterArgs)
                    .map(([key, value]) => `${key}=${value}`)
                    .join(';');
                line += `{${args}}`;
            }
        }
        
        // Add trigger
        if (components.trigger) {
            line += ' ' + components.trigger;
        }
        
        // Add inline conditions with proper prefix support
        if (components.conditions && components.conditions.length > 0) {
            for (const condition of components.conditions) {
                let prefix = '?';
                
                // Handle inline condition types
                if (condition.type === 'trigger') {
                    // Trigger condition: ?~ or ?~!
                    prefix = condition.negated ? '?~!' : '?~';
                } else if (condition.type === 'target') {
                    // Target conditions are embedded in targeter args, skip here
                    continue;
                } else {
                    // Standard condition: ? or ?!
                    prefix = condition.negated ? '?!' : '?';
                }
                
                // Use custom prefix if provided (for backwards compatibility)
                if (condition.prefix) {
                    prefix = condition.prefix;
                }
                
                line += ` ${prefix}${condition.name}`;
                
                if (condition.args && Object.keys(condition.args).length > 0) {
                    const args = Object.entries(condition.args)
                        .map(([key, value]) => `${key}=${value}`)
                        .join(';');
                    line += `{${args}}`;
                }
            }
        }
        
        // Add chance
        if (components.chance) {
            line += ' ' + components.chance;
        }
        
        // Add health modifier
        if (components.healthModifier) {
            line += ' ' + components.healthModifier;
        }
        
        return line;
    },

    /**
     * Return empty parse result
     */
    emptyResult() {
        return {
            original: '',
            mechanic: null,
            mechanicArgs: {},
            targeter: '@Self',
            targeterArgs: {},
            trigger: null,
            conditions: [],
            chance: null,
            healthModifier: null,
            valid: false,
            errors: ['Empty skill line']
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillLineParser;
}

console.log('✅ SkillLineParser utility loaded');
