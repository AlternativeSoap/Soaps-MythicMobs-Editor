/**
 * Comprehensive MythicMobs Triggers - Legacy Adapter
 * This file provides backward compatibility by converting the new comprehensive
 * TRIGGERS_DATA from data/triggers.js into the old format used by SkillBuilderEditor
 */

// Wait for TRIGGERS_DATA to load from data/triggers.js
if (typeof TRIGGERS_DATA !== 'undefined') {
    // Convert new format to old format for backward compatibility
    const OLD_FORMAT_TRIGGERS_DATA = {};
    const categoryMap = {
        'combat': 'COMBAT',
        'lifecycle': 'LIFECYCLE',
        'player': 'INTERACTION',
        'timed': 'TIMED',
        'projectile': 'PROJECTILE',
        'special': 'SPECIAL',
        'communication': 'SPECIAL'
    };

    // Build old format from new comprehensive data
    TRIGGERS_DATA.triggers.forEach(trigger => {
        const oldCategory = categoryMap[trigger.category] || 'SPECIAL';
        if (!OLD_FORMAT_TRIGGERS_DATA[oldCategory]) {
            OLD_FORMAT_TRIGGERS_DATA[oldCategory] = [];
        }
        
        OLD_FORMAT_TRIGGERS_DATA[oldCategory].push({
            name: `~${trigger.name}`,
            description: trigger.description.substring(0, 60) + (trigger.description.length > 60 ? '...' : ''),
            params: trigger.parameters ? [trigger.parameters.name] : []
        });
    });

    const ALL_TRIGGERS = Object.values(OLD_FORMAT_TRIGGERS_DATA).flat();
    const TRIGGER_CATEGORIES = Object.keys(OLD_FORMAT_TRIGGERS_DATA);

    // Legacy export for backward compatibility
    const Triggers = ALL_TRIGGERS.map(t => t.name);

    window.Triggers = Triggers;
    window.OLD_FORMAT_TRIGGERS_DATA = OLD_FORMAT_TRIGGERS_DATA;
    window.ALL_TRIGGERS = ALL_TRIGGERS;
    window.TRIGGER_CATEGORIES = TRIGGER_CATEGORIES;
}
