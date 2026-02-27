/**
 * MythicMobs Variable Manager
 * Global singleton for tracking all variables across the current pack
 * Provides variable detection, registration, and autocomplete APIs
 */

class VariableManager {
    constructor() {
        this.variables = new Map(); // key: "scope.name" -> VariableDefinition
        this.usages = new Map();    // key: "scope.name" -> [{ file, skillName, line, type }]
        this.packContext = null;
        this.lastScanTime = 0;
        this.scanDebounceMs = 500;
        this._initialized = false;
        
        // Bind methods
        this.scanPack = this.scanPack.bind(this);
        this.extractFromSkill = this.extractFromSkill.bind(this);
        this.extractFromMob = this.extractFromMob.bind(this);
    }
    
    /**
     * Initialize the variable manager (call once on app start)
     */
    init() {
        if (this._initialized) return;
        this._initialized = true;
        
        // Listen for pack changes
        document.addEventListener('pack-loaded', () => this.scanPack());
        document.addEventListener('skill-saved', () => this.debouncedScan());
        document.addEventListener('mob-saved', () => this.debouncedScan());
        
        if (window.DEBUG_MODE) console.log('[VariableManager] Initialized');
    }
    
    /**
     * Debounced scan to avoid rapid rescans
     */
    debouncedScan() {
        const now = Date.now();
        if (now - this.lastScanTime < this.scanDebounceMs) return;
        this.lastScanTime = now;
        this.scanPack();
    }
    
    /**
     * Scan the entire pack for variable definitions and usages
     */
    scanPack() {
        this.variables.clear();
        this.usages.clear();
        
        // Get current pack from storage
        const packName = window.storageManager?.getCurrentPackName?.();
        if (!packName) {
            if (window.DEBUG_MODE) console.log('[VariableManager] No pack loaded');
            return;
        }
        
        const pack = window.storageManager?.loadPack?.(packName);
        if (!pack) {
            if (window.DEBUG_MODE) console.log('[VariableManager] Pack not found:', packName);
            return;
        }
        
        this.packContext = packName;
        
        // Scan mobs for Variables section and skill references
        if (pack.mobs) {
            for (const [mobName, mobData] of Object.entries(pack.mobs)) {
                this.extractFromMob(mobName, mobData);
            }
        }
        
        // Scan skills for variable mechanics
        if (pack.skills) {
            for (const [skillName, skillData] of Object.entries(pack.skills)) {
                this.extractFromSkill(skillName, skillData);
            }
        }
        
        if (window.DEBUG_MODE) console.log(`[VariableManager] Scanned pack "${packName}": ${this.variables.size} variables, ${this.usages.size} usage locations`);
        
        // Emit event for UI updates
        document.dispatchEvent(new CustomEvent('variables-updated', {
            detail: { count: this.variables.size }
        }));
    }
    
    /**
     * Extract variables from a mob configuration
     */
    extractFromMob(mobName, mobData) {
        // Check for Variables section
        if (mobData.Variables) {
            for (const [varName, varValue] of Object.entries(mobData.Variables)) {
                const type = this.detectTypeFromValue(varValue);
                const key = `caster.${varName}`;
                
                this.registerVariable({
                    name: varName,
                    scope: 'CASTER',
                    type: type,
                    value: varValue,
                    source: { type: 'mob', name: mobName, section: 'Variables' },
                    persistent: true // Mob variables are set on spawn
                });
            }
        }
        
        // Check Skills section for variable usages
        if (mobData.Skills) {
            const lines = Array.isArray(mobData.Skills) ? mobData.Skills : [];
            lines.forEach((line, index) => {
                this.extractVariablesFromLine(line, { type: 'mob', name: mobName, line: index });
            });
        }
        
        // Check AITargetSelectors, AIGoalSelectors for variable usage
        ['AITargetSelectors', 'AIGoalSelectors'].forEach(section => {
            if (mobData[section]) {
                const lines = Array.isArray(mobData[section]) ? mobData[section] : [];
                lines.forEach((line, index) => {
                    this.extractVariablesFromLine(line, { type: 'mob', name: mobName, section, line: index });
                });
            }
        });
    }
    
    /**
     * Extract variables from a skill configuration
     */
    extractFromSkill(skillName, skillData) {
        // Check Skills section for variable operations
        const lines = skillData.Skills || skillData.skills || [];
        if (Array.isArray(lines)) {
            lines.forEach((line, index) => {
                this.extractVariablesFromLine(line, { type: 'skill', name: skillName, line: index });
            });
        }
        
        // Check Conditions for variable conditions
        const conditions = skillData.Conditions || skillData.conditions || [];
        if (Array.isArray(conditions)) {
            conditions.forEach((line, index) => {
                this.extractVariableConditionsFromLine(line, { type: 'skill', name: skillName, section: 'Conditions', line: index });
            });
        }
        
        // Check TargetConditions
        const targetConditions = skillData.TargetConditions || skillData.targetconditions || [];
        if (Array.isArray(targetConditions)) {
            targetConditions.forEach((line, index) => {
                this.extractVariableConditionsFromLine(line, { type: 'skill', name: skillName, section: 'TargetConditions', line: index });
            });
        }
    }
    
    /**
     * Extract variables from a single skill line
     */
    extractVariablesFromLine(line, source) {
        if (typeof line !== 'string') return;
        
        // Match setvariable mechanics
        const setVarMatch = line.match(/setvariable\{([^}]+)\}/i);
        if (setVarMatch) {
            const attrs = this.parseAttributes(setVarMatch[1]);
            if (attrs.var) {
                const parsed = this.parseVariableName(attrs.var, attrs.scope);
                this.registerVariable({
                    name: parsed.name,
                    scope: parsed.scope,
                    type: attrs.type || 'INTEGER',
                    value: attrs.value || '',
                    source: source,
                    save: attrs.save === 'true',
                    duration: parseInt(attrs.duration) || 0
                });
            }
        }
        
        // Match variableadd/variablesubtract
        const mathMatch = line.match(/variable(?:add|subtract|math)\{([^}]+)\}/i);
        if (mathMatch) {
            const attrs = this.parseAttributes(mathMatch[1]);
            if (attrs.var) {
                const parsed = this.parseVariableName(attrs.var, attrs.scope);
                this.recordUsage(parsed.scope, parsed.name, source, 'write');
            }
        }
        
        // Match setvariablelocation
        const locMatch = line.match(/setvariablelocation\{([^}]+)\}/i);
        if (locMatch) {
            const attrs = this.parseAttributes(locMatch[1]);
            if (attrs.var) {
                const parsed = this.parseVariableName(attrs.var, attrs.scope);
                this.registerVariable({
                    name: parsed.name,
                    scope: parsed.scope,
                    type: 'LOCATION',
                    source: source
                });
            }
        }
        
        // Match variableunset
        const unsetMatch = line.match(/variableunset\{([^}]+)\}/i);
        if (unsetMatch) {
            const attrs = this.parseAttributes(unsetMatch[1]);
            if (attrs.var) {
                const parsed = this.parseVariableName(attrs.var, attrs.scope);
                this.recordUsage(parsed.scope, parsed.name, source, 'unset');
            }
        }
        
        // Match variable placeholders for reads
        const placeholderMatches = line.matchAll(/<(caster|target|trigger|skill|world|global)\.var\.([^>|.]+)/gi);
        for (const match of placeholderMatches) {
            const scope = match[1].toUpperCase();
            const name = match[2];
            this.recordUsage(scope, name, source, 'read');
        }
    }
    
    /**
     * Extract variable conditions from a line
     */
    extractVariableConditionsFromLine(line, source) {
        if (typeof line !== 'string') return;
        
        // Match variable conditions
        const conditionMatch = line.match(/variable(?:equals|isset|inrange|contains)\{([^}]+)\}/i);
        if (conditionMatch) {
            const attrs = this.parseAttributes(conditionMatch[1]);
            if (attrs.var) {
                const parsed = this.parseVariableName(attrs.var, attrs.scope);
                this.recordUsage(parsed.scope, parsed.name, source, 'condition');
            }
        }
    }
    
    /**
     * Register a variable definition
     */
    registerVariable(varDef) {
        const key = `${varDef.scope.toLowerCase()}.${varDef.name}`;
        
        // Merge with existing if already registered
        const existing = this.variables.get(key);
        if (existing) {
            // Update with new info if more specific
            if (varDef.type && varDef.type !== 'INTEGER') {
                existing.type = varDef.type;
            }
            if (varDef.value) {
                existing.value = varDef.value;
            }
            if (!existing.sources) existing.sources = [];
            existing.sources.push(varDef.source);
        } else {
            this.variables.set(key, {
                name: varDef.name,
                scope: varDef.scope.toUpperCase(),
                type: varDef.type || 'INTEGER',
                value: varDef.value || '',
                save: varDef.save || false,
                duration: varDef.duration || 0,
                sources: [varDef.source]
            });
        }
    }
    
    /**
     * Record a variable usage
     */
    recordUsage(scope, name, source, usageType) {
        const key = `${scope.toLowerCase()}.${name}`;
        
        if (!this.usages.has(key)) {
            this.usages.set(key, []);
        }
        
        this.usages.get(key).push({
            ...source,
            usageType
        });
    }
    
    /**
     * Parse variable name with scope
     * Handles: "caster.varname" or "varname" with separate scope
     */
    parseVariableName(varString, scopeAttr) {
        const parts = varString.split('.');
        if (parts.length >= 2) {
            const scope = parts[0].toUpperCase();
            const name = parts.slice(1).join('.');
            return { scope, name };
        }
        return {
            scope: (scopeAttr || 'CASTER').toUpperCase(),
            name: varString
        };
    }
    
    /**
     * Parse mechanic attributes string
     */
    parseAttributes(attrString) {
        const attrs = {};
        const pairs = attrString.split(';');
        
        for (const pair of pairs) {
            const eqIndex = pair.indexOf('=');
            if (eqIndex > -1) {
                const key = pair.substring(0, eqIndex).trim().toLowerCase();
                let value = pair.substring(eqIndex + 1).trim();
                // Remove quotes
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                attrs[key] = value;
            }
        }
        
        return attrs;
    }
    
    /**
     * Detect variable type from value
     */
    detectTypeFromValue(value) {
        if (typeof value === 'boolean') return 'BOOLEAN';
        if (typeof value === 'number') {
            return Number.isInteger(value) ? 'INTEGER' : 'FLOAT';
        }
        
        const str = String(value);
        
        // Check for type prefix
        if (str.startsWith('int/')) return 'INTEGER';
        if (str.startsWith('float/')) return 'FLOAT';
        if (str.startsWith('long/')) return 'LONG';
        if (str.startsWith('double/')) return 'DOUBLE';
        if (str.startsWith('string/')) return 'STRING';
        if (str.startsWith('boolean/')) return 'BOOLEAN';
        if (str.startsWith('list/')) return 'LIST';
        if (str.startsWith('set/')) return 'SET';
        if (str.startsWith('map/')) return 'MAP';
        if (str.startsWith('location/')) return 'LOCATION';
        if (str.startsWith('vector/')) return 'VECTOR';
        if (str.startsWith('time/')) return 'TIME';
        if (str.startsWith('skill/')) return 'METASKILL';
        if (str.startsWith('item/')) return 'ITEM';
        
        // Infer from value format
        if (str === 'true' || str === 'false' || str === 'yes' || str === 'no') {
            return 'BOOLEAN';
        }
        if (/^-?\d+$/.test(str)) return 'INTEGER';
        if (/^-?\d+\.\d+$/.test(str)) return 'FLOAT';
        
        return 'STRING';
    }
    
    // =========================================================================
    // PUBLIC API
    // =========================================================================
    
    /**
     * Get all registered variables
     */
    getAll() {
        return Array.from(this.variables.values());
    }
    
    /**
     * Get variables by scope
     */
    getByScope(scope) {
        return this.getAll().filter(v => v.scope === scope.toUpperCase());
    }
    
    /**
     * Get variables by type
     */
    getByType(type) {
        return this.getAll().filter(v => v.type === type.toUpperCase());
    }
    
    /**
     * Get usages for a specific variable
     */
    getUsages(scope, name) {
        const key = `${scope.toLowerCase()}.${name}`;
        return this.usages.get(key) || [];
    }
    
    /**
     * Check if a variable exists
     */
    exists(scope, name) {
        const key = `${scope.toLowerCase()}.${name}`;
        return this.variables.has(key);
    }
    
    /**
     * Get a specific variable
     */
    get(scope, name) {
        const key = `${scope.toLowerCase()}.${name}`;
        return this.variables.get(key);
    }
    
    /**
     * Suggest variables for autocomplete
     */
    suggest(prefix, scopeFilter = null) {
        let candidates = this.getAll();
        
        // Filter by scope if specified
        if (scopeFilter) {
            candidates = candidates.filter(v => v.scope === scopeFilter.toUpperCase());
        }
        
        // Filter by prefix
        if (prefix) {
            const lowerPrefix = prefix.toLowerCase();
            candidates = candidates.filter(v => 
                v.name.toLowerCase().startsWith(lowerPrefix) ||
                `${v.scope.toLowerCase()}.${v.name}`.startsWith(lowerPrefix)
            );
        }
        
        // Sort by relevance
        return candidates.sort((a, b) => {
            // Prefer exact prefix matches
            const aStarts = a.name.toLowerCase().startsWith(prefix?.toLowerCase() || '');
            const bStarts = b.name.toLowerCase().startsWith(prefix?.toLowerCase() || '');
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            
            // Then alphabetically
            return a.name.localeCompare(b.name);
        });
    }
    
    /**
     * Get placeholder for a variable
     */
    getPlaceholder(scope, name) {
        return `<${scope.toLowerCase()}.var.${name}>`;
    }
    
    /**
     * Generate setVariable line for a variable
     */
    generateSetVariable(varDef) {
        let line = `setvariable{var=${varDef.scope.toLowerCase()}.${varDef.name}`;
        
        if (varDef.value) {
            // Quote value if it contains special characters
            const needsQuotes = /[<>;\s]/.test(varDef.value);
            line += `;value=${needsQuotes ? '"' + varDef.value + '"' : varDef.value}`;
        }
        
        if (varDef.type && varDef.type !== 'INTEGER') {
            line += `;type=${varDef.type}`;
        }
        
        if (varDef.save) {
            line += `;save=true`;
        }
        
        if (varDef.duration && varDef.duration > 0) {
            line += `;duration=${varDef.duration}`;
        }
        
        line += '}';
        return line;
    }
    
    /**
     * Get statistics about variables
     */
    getStats() {
        const all = this.getAll();
        const stats = {
            total: all.length,
            byScope: {},
            byType: {}
        };
        
        // Count by scope
        for (const scope of ['SKILL', 'CASTER', 'TARGET', 'WORLD', 'GLOBAL']) {
            stats.byScope[scope] = all.filter(v => v.scope === scope).length;
        }
        
        // Count by type
        const types = [...new Set(all.map(v => v.type))];
        for (const type of types) {
            stats.byType[type] = all.filter(v => v.type === type).length;
        }
        
        return stats;
    }
}

// Create singleton instance
const variableManager = new VariableManager();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.variableManager = variableManager;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => variableManager.init());
    } else {
        variableManager.init();
    }
}
