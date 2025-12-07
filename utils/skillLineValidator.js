/**
 * Skill Line Validator Utility
 * Context-aware validation for MythicMobs skill lines
 * 
 * Validates based on context:
 * - Mob context: Triggers are REQUIRED
 * - Skill context: Triggers are NOT ALLOWED
 */

const SkillLineValidator = {
    /**
     * Validate a parsed skill line
     * @param {Object} parsed - Parsed skill line from SkillLineParser
     * @param {string} context - 'mob' or 'skill'
     * @returns {Object} Validation result {valid, errors, warnings}
     */
    validate(parsed, context = 'mob') {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Check if mechanic exists
        if (!parsed.mechanic) {
            result.errors.push('Mechanic is required');
            result.valid = false;
        }

        // Context-specific validation
        if (context === 'mob') {
            // In mob context, trigger is REQUIRED
            if (!parsed.trigger) {
                result.errors.push('Trigger is required in mob context (e.g., ~onAttack, ~onDamaged, ~onTimer:100)');
                result.valid = false;
            }
        } else if (context === 'skill') {
            // In skill context, trigger should NOT be present
            if (parsed.trigger) {
                result.errors.push('Triggers cannot be used in skill files (only in mob files)');
                result.valid = false;
            }
        }

        // Validate mechanic arguments (if MECHANICS_DATA is available)
        if (typeof MECHANICS_DATA !== 'undefined' && parsed.mechanic) {
            const mechanicDef = MECHANICS_DATA.getMechanic(parsed.mechanic);
            if (!mechanicDef) {
                result.warnings.push(`Unknown mechanic: ${parsed.mechanic}`);
            } else {
                // Check for required attributes
                const requiredAttrs = mechanicDef.attributes.filter(attr => attr.required);
                for (const attr of requiredAttrs) {
                    const aliases = [attr.name, ...(attr.aliases || [])];
                    const hasAttr = aliases.some(alias => parsed.mechanicArgs.hasOwnProperty(alias));
                    if (!hasAttr) {
                        result.warnings.push(`Mechanic '${parsed.mechanic}' missing required attribute: ${attr.name}`);
                    }
                }
            }
        }

        // Validate targeter (if TARGETERS_DATA is available)
        if (typeof TARGETERS_DATA !== 'undefined' && parsed.targeter && parsed.targeter !== '@Self') {
            const targeterName = parsed.targeter.substring(1); // Remove @
            const targeterDef = TARGETERS_DATA.getTargeter(targeterName);
            if (!targeterDef) {
                result.warnings.push(`Unknown targeter: ${parsed.targeter}`);
            } else {
                // Check module requirements
                if (targeterDef.moduleRequirements && targeterDef.moduleRequirements.length > 0) {
                    result.warnings.push(`Targeter '${parsed.targeter}' requires: ${targeterDef.moduleRequirements.join(', ')}`);
                }
            }
        }

        // Validate trigger syntax
        if (parsed.trigger) {
            const validTriggerPattern = /^~(on[A-Z][a-zA-Z]*|onTimer:\d+)$/;
            if (!validTriggerPattern.test(parsed.trigger)) {
                result.warnings.push(`Trigger '${parsed.trigger}' may have invalid syntax. Expected format: ~onEventName or ~onTimer:ticks`);
            }
        }

        // Validate chance format
        if (parsed.chance) {
            const chanceNum = parseFloat(parsed.chance);
            if (parsed.chance.includes('%')) {
                // Percentage format
                const percent = parseFloat(parsed.chance);
                if (isNaN(percent) || percent < 0 || percent > 100) {
                    result.warnings.push(`Chance '${parsed.chance}' is invalid. Expected 0-100%`);
                }
            } else {
                // Decimal format
                if (isNaN(chanceNum) || chanceNum < 0 || chanceNum > 1) {
                    result.warnings.push(`Chance '${parsed.chance}' is invalid. Expected 0.0-1.0 or 0%-100%`);
                }
            }
        }

        // Validate health modifier format
        if (parsed.healthModifier) {
            const validHealthPattern = /^[<>=][\d.]+%?(-[\d.]+%?)?$/;
            if (!validHealthPattern.test(parsed.healthModifier)) {
                result.warnings.push(`Health modifier '${parsed.healthModifier}' may have invalid syntax. Expected format: <50%, >75%, =30%-50%`);
            }
        }

        // Overall validation status
        result.valid = result.errors.length === 0;

        return result;
    },

    /**
     * Quick validation check (returns boolean only)
     * @param {Object} parsed - Parsed skill line
     * @param {string} context - 'mob' or 'skill'
     * @returns {boolean} True if valid
     */
    isValid(parsed, context = 'mob') {
        return this.validate(parsed, context).valid;
    },

    /**
     * Get friendly error messages for UI display
     * @param {Object} validation - Validation result
     * @returns {string} Formatted error/warning messages
     */
    getDisplayMessage(validation) {
        const messages = [];
        
        if (validation.errors.length > 0) {
            messages.push('❌ Errors:');
            validation.errors.forEach(err => messages.push(`  • ${err}`));
        }
        
        if (validation.warnings.length > 0) {
            messages.push('⚠️ Warnings:');
            validation.warnings.forEach(warn => messages.push(`  • ${warn}`));
        }
        
        if (validation.valid && validation.errors.length === 0 && validation.warnings.length === 0) {
            messages.push('✅ Valid skill line');
        }
        
        return messages.join('\n');
    },

    /**
     * Validate multiple skill lines at once
     * @param {Array} skillLines - Array of skill line strings
     * @param {string} context - 'mob' or 'skill'
     * @returns {Object} Validation summary
     */
    validateMultiple(skillLines, context = 'mob') {
        const results = {
            total: skillLines.length,
            valid: 0,
            invalid: 0,
            details: []
        };

        for (let i = 0; i < skillLines.length; i++) {
            const line = skillLines[i];
            const parsed = SkillLineParser.parse(line);
            const validation = this.validate(parsed, context);
            
            results.details.push({
                index: i,
                line: line,
                validation: validation
            });
            
            if (validation.valid) {
                results.valid++;
            } else {
                results.invalid++;
            }
        }

        return results;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillLineValidator;
}

// Loaded silently
