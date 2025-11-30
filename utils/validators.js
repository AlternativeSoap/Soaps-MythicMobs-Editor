/**
 * Validator - Validates MythicMobs configurations
 */
class Validator {
    validateMob(mob) {
        const errors = [];
        const warnings = [];
        
        if (!mob.name || mob.name.trim() === '') {
            errors.push('Mob name is required');
        }
        
        if (!mob.type) {
            errors.push('Entity type is required');
        }
        
        if (mob.health <= 0) {
            errors.push('Health must be greater than 0');
        }
        
        if (mob.health < 20) {
            warnings.push('Health is very low, mob may die quickly');
        }
        
        return { errors, warnings, isValid: errors.length === 0 };
    }
    
    validateSkill(skill) {
        const errors = [];
        const warnings = [];
        
        if (!skill.name || skill.name.trim() === '') {
            errors.push('Skill name is required');
        }
        
        if (skill.mechanics.length === 0) {
            warnings.push('Skill has no mechanics');
        }
        
        return { errors, warnings, isValid: errors.length === 0 };
    }
    
    validateItem(item) {
        const errors = [];
        const warnings = [];
        
        if (!item.name || item.name.trim() === '') {
            errors.push('Item name is required');
        }
        
        if (!item.material) {
            errors.push('Material is required');
        }
        
        return { errors, warnings, isValid: errors.length === 0 };
    }
}

window.Validator = Validator;
