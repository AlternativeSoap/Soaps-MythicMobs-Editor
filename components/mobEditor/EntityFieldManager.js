/**
 * Entity Field Manager - Manages dynamic field visibility based on entity type
 */
class EntityFieldManager {
    constructor() {
        this.entityFields = ENTITY_FIELDS;
        this.entityMapping = ENTITY_TYPE_MAPPING;
        this.entityDefaults = ENTITY_DEFAULTS;
        this.currentEntityType = null;
    }
    
    /**
     * Get all fields available for a specific entity type
     */
    getFieldsForEntity(entityType) {
        const groups = this.entityMapping[entityType] || ['UNIVERSAL'];
        const fields = new Set();
        
        groups.forEach(group => {
            if (this.entityFields[group]) {
                this.entityFields[group].forEach(field => fields.add(field));
            }
        });
        
        return Array.from(fields);
    }
    
    /**
     * Check if a field should be shown for the given entity type
     */
    shouldShowField(entityType, fieldName) {
        const allowedFields = this.getFieldsForEntity(entityType);
        return allowedFields.includes(fieldName);
    }
    
    /**
     * Update field visibility in the DOM based on entity type
     */
    updateFieldVisibility(entityType) {
        this.currentEntityType = entityType;
        
        document.querySelectorAll('[data-mob-field]').forEach(fieldContainer => {
            const fieldName = fieldContainer.dataset.mobField;
            const shouldShow = this.shouldShowField(entityType, fieldName);
            
            if (shouldShow) {
                fieldContainer.style.display = '';
                fieldContainer.classList.remove('field-hidden');
                
                // Enable inputs
                const inputs = fieldContainer.querySelectorAll('input, select, textarea');
                inputs.forEach(input => input.disabled = false);
            } else {
                fieldContainer.style.display = 'none';
                fieldContainer.classList.add('field-hidden');
                
                // Disable inputs so they don't export
                const inputs = fieldContainer.querySelectorAll('input, select, textarea');
                inputs.forEach(input => input.disabled = true);
            }
        });
    }
    
    /**
     * Get default values for an entity type
     */
    getDefaultsForEntity(entityType) {
        return this.entityDefaults[entityType] || {
            health: 20,
            damage: 5,
            movementSpeed: 0.25,
            armor: 0
        };
    }
    
    /**
     * Apply default values to the form
     */
    applyDefaults(entityType) {
        const defaults = this.getDefaultsForEntity(entityType);
        
        Object.keys(defaults).forEach(key => {
            const input = document.getElementById(`mob-${key.toLowerCase()}`);
            if (input && !input.value) {
                input.value = defaults[key];
            }
        });
    }
    
    /**
     * Get entity category
     */
    getEntityCategory(entityType) {
        for (const [category, entities] of Object.entries(ENTITY_CATEGORIES)) {
            if (entities.includes(entityType)) {
                return category;
            }
        }
        return 'Other';
    }
    
    /**
     * Get all entities by category
     */
    getEntitiesByCategory() {
        return ENTITY_CATEGORIES;
    }
    
    /**
     * Get all entity types (for dropdowns)
     */
    getAllEntityTypes() {
        return Object.keys(this.entityMapping);
    }
    
    /**
     * Check if entity is a living entity
     */
    isLivingEntity(entityType) {
        const fields = this.getFieldsForEntity(entityType);
        return fields.includes('Health') && fields.includes('Damage');
    }
    
    /**
     * Check if entity can have equipment
     */
    canHaveEquipment(entityType) {
        const fields = this.getFieldsForEntity(entityType);
        return fields.includes('Equipment');
    }
    
    /**
     * Check if entity can have AI
     */
    canHaveAI(entityType) {
        const fields = this.getFieldsForEntity(entityType);
        return fields.includes('AIGoalSelectors');
    }
    
    /**
     * Get field hints/descriptions
     */
    getFieldHint(fieldName) {
        const hints = {
            'Health': 'Maximum health points',
            'Damage': 'Attack damage dealt to targets',
            'Armor': 'Armor points (reduces damage taken)',
            'MovementSpeed': 'Movement speed multiplier (default: 0.25)',
            'FollowRange': 'Range at which mob detects targets',
            'KnockbackResistance': 'Resistance to knockback (0-1)',
            'AttackSpeed': 'Ticks between attacks',
            'Display': 'Custom display name (supports color codes)',
            'ExplosionRadius': 'Radius of explosion',
            'FuseTime': 'Ticks before explosion (20 ticks = 1 second)',
            'Size': 'Size of the entity (1-127)',
            'Pose': 'Armor stand limb rotations',
            'Small': 'Makes armor stand small',
            'ShowArms': 'Show armor stand arms',
            'ShowBasePlate': 'Show armor stand base plate',
            'Marker': 'Makes armor stand a marker (no hitbox)',
            'Age': 'Age of entity (-24000 for baby, 0 for adult)',
            'Baby': 'Makes mob a baby variant',
            'Profession': 'Villager profession',
            'VillagerLevel': 'Villager level (1-5)',
            'Tame': 'Is the entity tamed',
            'Powered': 'Makes creeper charged',
            'Glowing': 'Makes entity glow',
            'Invisible': 'Makes entity invisible',
            'Silent': 'Prevents entity from making sounds',
            'NoGravity': 'Disables gravity',
            'Persistent': 'Prevents natural despawning'
        };
        
        return hints[fieldName] || '';
    }
}
