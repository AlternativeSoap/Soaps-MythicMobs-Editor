/**
 * MythicMobs Conditions Index
 * Aggregates all condition types and exports them for use throughout the application
 */

// Aggregate all conditions into a single array
const ALL_CONDITIONS = [
    ...(window.ENTITY_CONDITIONS || []),
    ...(window.ENTITY_CONDITIONS_ADVANCED || []),
    ...(window.LOCATION_CONDITIONS || []),
    ...(window.COMPARE_CONDITIONS || []),
    ...(window.META_CONDITIONS || []),
    ...(window.META_CONDITIONS_ADVANCED || []),
    ...(window.META_CONDITIONS_FINAL || [])
];

// Create category groups
const CONDITION_CATEGORIES = {
    'Entity State': [],
    'Entity Type': [],
    'Player': [],
    'Location': [],
    'Time & Weather': [],
    'Combat': [],
    'Variables & Data': [],
    'Server & World': [],
    'Logic & Meta': []
};

// Populate categories
ALL_CONDITIONS.forEach(condition => {
    if (CONDITION_CATEGORIES[condition.category]) {
        CONDITION_CATEGORIES[condition.category].push(condition);
    }
});

// Create lookup maps for fast access
const CONDITIONS_BY_ID = {};
const CONDITIONS_BY_ALIAS = {};

ALL_CONDITIONS.forEach(condition => {
    // Map by ID
    CONDITIONS_BY_ID[condition.id] = condition;
    
    // Map by name (lowercase for case-insensitive lookup)
    CONDITIONS_BY_ID[condition.name.toLowerCase().replace(/\s+/g, '')] = condition;
    
    // Map by aliases
    if (condition.aliases && condition.aliases.length > 0) {
        condition.aliases.forEach(alias => {
            CONDITIONS_BY_ALIAS[alias.toLowerCase()] = condition;
        });
    }
});

// Helper functions
const ConditionHelpers = {
    /**
     * Find a condition by ID, name, or alias
     * @param {string} identifier - The condition ID, name, or alias
     * @returns {object|null} The condition object or null if not found
     */
    findCondition(identifier) {
        if (!identifier) return null;
        
        const key = identifier.toLowerCase().replace(/\s+/g, '');
        return CONDITIONS_BY_ID[key] || CONDITIONS_BY_ALIAS[key] || null;
    },
    
    /**
     * Get all conditions for a specific category
     * @param {string} category - The category name
     * @returns {array} Array of conditions in the category
     */
    getByCategory(category) {
        return CONDITION_CATEGORIES[category] || [];
    },
    
    /**
     * Search conditions by name or description
     * @param {string} query - Search query
     * @returns {array} Array of matching conditions
     */
    search(query) {
        if (!query) return ALL_CONDITIONS;
        
        const lowerQuery = query.toLowerCase();
        return ALL_CONDITIONS.filter(condition => {
            return condition.name.toLowerCase().includes(lowerQuery) ||
                   condition.description.toLowerCase().includes(lowerQuery) ||
                   condition.aliases.some(alias => alias.toLowerCase().includes(lowerQuery));
        });
    },
    
    /**
     * Get condition syntax string
     * @param {object} condition - The condition object
     * @param {object} values - Attribute values
     * @returns {string} The formatted condition syntax
     */
    generateSyntax(condition, values = {}) {
        if (!condition) return '';
        
        let syntax = condition.id;
        
        // Add attributes if any
        const attrs = [];
        if (condition.attributes && condition.attributes.length > 0) {
            condition.attributes.forEach(attr => {
                const value = values[attr.name];
                if (value !== undefined && value !== '') {
                    // Use first alias if available, otherwise use attribute name
                    const key = attr.aliases && attr.aliases.length > 0 ? attr.aliases[0] : attr.name;
                    attrs.push(`${key}=${value}`);
                }
            });
        }
        
        if (attrs.length > 0) {
            syntax += `{${attrs.join(';')}}`;
        }
        
        return syntax;
    },
    
    /**
     * Parse a condition string into components
     * @param {string} conditionStr - The condition string to parse
     * @returns {object} Parsed condition components
     */
    parseCondition(conditionStr) {
        if (!conditionStr) return null;
        
        // Remove leading dash and trim
        conditionStr = conditionStr.replace(/^-\s*/, '').trim();
        
        // Extract condition name and attributes
        const nameMatch = conditionStr.match(/^([a-zA-Z_]+)/);
        if (!nameMatch) return null;
        
        const conditionName = nameMatch[1];
        const condition = this.findCondition(conditionName);
        if (!condition) return null;
        
        // Extract attributes
        const attrMatch = conditionStr.match(/\{([^}]+)\}/);
        const attributes = {};
        
        if (attrMatch) {
            const attrStr = attrMatch[1];
            const pairs = attrStr.split(';');
            pairs.forEach(pair => {
                const [key, value] = pair.split('=').map(s => s.trim());
                if (key && value) {
                    attributes[key] = value;
                }
            });
        }
        
        // Extract action
        const actionMatch = conditionStr.match(/\}\s+(.+)$/);
        const action = actionMatch ? actionMatch[1].trim() : 'true';
        
        return {
            condition,
            attributes,
            action,
            raw: conditionStr
        };
    },
    
    /**
     * Validate a condition configuration
     * @param {object} condition - The condition object
     * @param {object} values - Attribute values to validate
     * @returns {object} Validation result with isValid, errors array, and warnings array
     */
    validate(condition, values = {}) {
        const errors = [];
        const warnings = [];
        
        if (!condition) {
            return { isValid: false, errors: ['Invalid condition'], warnings: [] };
        }
        
        // Check required attributes
        if (condition.attributes) {
            condition.attributes.forEach(attr => {
                const value = values[attr.name];
                
                // Required field validation
                if (attr.required) {
                    if (value === undefined || value === null || value === '') {
                        errors.push(`'${attr.displayName || attr.name}' is required`);
                        return;
                    }
                }
                
                // Skip further validation if value is empty and not required
                if (value === undefined || value === null || value === '') {
                    return;
                }
                
                // Type-specific validation
                const validationResult = this.validateAttributeValue(attr, value);
                if (!validationResult.isValid) {
                    errors.push(...validationResult.errors);
                }
                if (validationResult.warnings && validationResult.warnings.length > 0) {
                    warnings.push(...validationResult.warnings);
                }
            });
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    },

    /**
     * Validate a specific attribute value based on its type and validation rules
     * @param {object} attr - The attribute definition
     * @param {*} value - The value to validate
     * @returns {object} Validation result with isValid, errors, and warnings
     */
    validateAttributeValue(attr, value) {
        const errors = [];
        const warnings = [];
        const attrName = attr.displayName || attr.name;
        
        // Skip validation if no value
        if (value === undefined || value === null || value === '') {
            return { isValid: true, errors: [], warnings: [] };
        }
        
        const valueStr = String(value).trim();
        
        // Number range validation (e.g., "3-5" or ">10" or "5")
        if (attr.validation === 'number_range') {
            const rangePattern = /^([<>]=?)?(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?$/;
            if (!rangePattern.test(valueStr)) {
                errors.push(`'${attrName}' must be a number, range (e.g., 3-5), or comparison (e.g., >10)`);
            } else {
                // Check if range is valid (min < max)
                const match = valueStr.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
                if (match) {
                    const min = parseFloat(match[1]);
                    const max = parseFloat(match[2]);
                    if (min > max) {
                        errors.push(`'${attrName}' range invalid: minimum (${min}) cannot be greater than maximum (${max})`);
                    }
                }
            }
        }
        
        // Number validation
        if (attr.type === 'number' && attr.validation !== 'number_range') {
            if (!/^-?\d+(?:\.\d+)?$/.test(valueStr)) {
                errors.push(`'${attrName}' must be a valid number`);
            } else {
                const num = parseFloat(valueStr);
                // Check min/max constraints if defined
                if (attr.min !== undefined && num < attr.min) {
                    errors.push(`'${attrName}' must be at least ${attr.min}`);
                }
                if (attr.max !== undefined && num > attr.max) {
                    errors.push(`'${attrName}' must be at most ${attr.max}`);
                }
            }
        }
        
        // Integer validation
        if (attr.validation === 'integer') {
            if (!/^-?\d+$/.test(valueStr)) {
                errors.push(`'${attrName}' must be a whole number (integer)`);
            }
        }
        
        // Boolean validation
        if (attr.type === 'boolean') {
            const validBooleans = ['true', 'false', 't', 'f', 'yes', 'no', 'y', 'n', '1', '0'];
            if (!validBooleans.includes(valueStr.toLowerCase())) {
                errors.push(`'${attrName}' must be true or false`);
            }
        }
        
        // Dropdown/select validation
        if (attr.type === 'select' && attr.options) {
            const validOptions = attr.options.map(opt => 
                typeof opt === 'string' ? opt.toLowerCase() : opt.value.toLowerCase()
            );
            if (!validOptions.includes(valueStr.toLowerCase())) {
                const optionsList = attr.options.map(opt => 
                    typeof opt === 'string' ? opt : opt.label
                ).join(', ');
                errors.push(`'${attrName}' must be one of: ${optionsList}`);
            }
        }
        
        // List validation (comma-separated values)
        if (attr.type === 'list') {
            const items = valueStr.split(',').map(s => s.trim()).filter(s => s);
            if (items.length === 0) {
                warnings.push(`'${attrName}' is empty - provide comma-separated values`);
            }
        }
        
        // Material validation
        if (attr.validation === 'material') {
            if (!/^[A-Z_]+$/.test(valueStr.toUpperCase())) {
                warnings.push(`'${attrName}' should be a valid Minecraft material (e.g., STONE, DIAMOND_SWORD)`);
            }
        }
        
        // Entity type validation
        if (attr.validation === 'entity_type') {
            if (!/^[A-Z_]+$/.test(valueStr.toUpperCase())) {
                warnings.push(`'${attrName}' should be a valid entity type (e.g., ZOMBIE, SKELETON)`);
            }
        }
        
        // Biome validation
        if (attr.validation === 'biome') {
            if (!/^[A-Z_]+$/.test(valueStr.toUpperCase())) {
                warnings.push(`'${attrName}' should be a valid biome (e.g., PLAINS, FOREST)`);
            }
        }
        
        // World validation
        if (attr.validation === 'world') {
            if (valueStr.includes(' ')) {
                errors.push(`'${attrName}' cannot contain spaces`);
            }
        }
        
        // MythicMobs internal name validation (for skills, mobs, etc.)
        if (attr.validation === 'mythicmobs_internal') {
            if (!/^[a-zA-Z0-9_-]+$/.test(valueStr)) {
                errors.push(`'${attrName}' can only contain letters, numbers, underscores, and hyphens`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
};

// Export everything
window.ALL_CONDITIONS = ALL_CONDITIONS;
window.CONDITION_CATEGORIES = CONDITION_CATEGORIES;
window.CONDITIONS_DATA = ALL_CONDITIONS; // Flat array for browser compatibility
window.CONDITIONS_BY_ID = CONDITIONS_BY_ID;
window.CONDITIONS_BY_ALIAS = CONDITIONS_BY_ALIAS;
window.ConditionHelpers = ConditionHelpers;

// Log summary (debug mode only)
if (window.DEBUG_MODE) {
    console.log('  - Total Conditions:', ALL_CONDITIONS.length);
    console.log('  - Entity State:', CONDITION_CATEGORIES['Entity State']?.length || 0);
    console.log('  - Entity Type:', CONDITION_CATEGORIES['Entity Type']?.length || 0);
    console.log('  - Player:', CONDITION_CATEGORIES['Player']?.length || 0);
    console.log('  - Location:', CONDITION_CATEGORIES['Location']?.length || 0);
    console.log('  - Time & Weather:', CONDITION_CATEGORIES['Time & Weather']?.length || 0);
    console.log('  - Combat:', CONDITION_CATEGORIES['Combat']?.length || 0);
    console.log('  - Variables & Data:', CONDITION_CATEGORIES['Variables & Data']?.length || 0);
    console.log('  - Server & World:', CONDITION_CATEGORIES['Server & World']?.length || 0);
    console.log('  - Logic & Meta:', CONDITION_CATEGORIES['Logic & Meta']?.length || 0);
    console.log('  - Condition Actions:', (window.CONDITION_ACTIONS || []).length);
}
