/**
 * Fancy Drops Configuration
 * DropOptions for mob-level fancy drop configuration
 */

const DROP_OPTIONS_CONFIG = {
    general: {
        label: 'General Settings',
        fields: [
            {
                name: 'DropMethod',
                label: 'Drop Method',
                type: 'select',
                default: 'VANILLA',
                options: [
                    { value: 'VANILLA', label: 'Vanilla - Normal drop behavior' },
                    { value: 'FANCY', label: 'Fancy - Advanced drops with tracking' }
                ],
                description: 'FANCY is required for damage tracking, scoreboards, and other fancy drop features'
            },
            {
                name: 'ShowDeathChatMessage',
                label: 'Show Death Chat Message',
                type: 'boolean',
                default: false,
                description: 'Show death message to players in chat',
                requiresFancy: true
            },
            {
                name: 'ShowDeathHologram',
                label: 'Show Death Hologram',
                type: 'boolean',
                default: false,
                description: 'Show hologram when mob dies',
                requiresFancy: true
            },
            {
                name: 'RequiredDamagePercent',
                label: 'Required Damage %',
                type: 'number',
                min: 0,
                max: 100,
                placeholder: '0',
                description: 'Minimum damage % required for drops (0-100)',
                requiresFancy: true
            }
        ]
    },
    perPlayer: {
        label: 'Per-Player Drops',
        fields: [
            {
                name: 'PerPlayerDrops',
                label: 'Per Player Drops',
                type: 'boolean',
                default: false,
                description: 'Calculate drops separately for each player (Paper only)',
                requiresFancy: true,
                paperOnly: true
            },
            {
                name: 'ClientSideDrops',
                label: 'Client Side Drops',
                type: 'boolean',
                default: false,
                description: 'Each player only sees their own drops',
                requiresFancy: true
            }
        ]
    },
    visualDefaults: {
        label: 'Visual Defaults',
        description: 'Default visual effects for all drops',
        fields: [
            {
                name: 'Lootsplosion',
                label: 'Lootsplosion',
                type: 'boolean',
                default: false,
                description: 'Drops spread outward by default',
                requiresFancy: true
            },
            {
                name: 'HologramItemNames',
                label: 'Hologram Item Names',
                type: 'boolean',
                default: false,
                description: 'Show hologram names for items by default',
                requiresFancy: true
            },
            {
                name: 'ItemGlowByDefault',
                label: 'Item Glow By Default',
                type: 'boolean',
                default: false,
                description: 'Make items glow by default (unstackable!)',
                requiresFancy: true
            },
            {
                name: 'ItemBeamByDefault',
                label: 'Item Beam By Default',
                type: 'boolean',
                default: false,
                description: 'Show particle beam above items by default',
                requiresFancy: true
            },
            {
                name: 'ItemVFXByDefault',
                label: 'Item VFX By Default',
                type: 'boolean',
                default: false,
                description: 'Enable item VFX by default',
                requiresFancy: true
            }
        ]
    },
    itemVFX: {
        label: 'Default Item VFX',
        description: 'Default visual effects configuration',
        fields: [
            {
                name: 'ItemVFX.Material',
                label: 'VFX Material',
                type: 'text',
                placeholder: 'POTION',
                description: 'Material for item VFX',
                requiresFancy: true
            },
            {
                name: 'ItemVFX.Data',
                label: 'VFX Custom Model Data',
                type: 'number',
                placeholder: '0',
                description: 'Custom model data for VFX',
                requiresFancy: true
            },
            {
                name: 'ItemVFX.Color',
                label: 'VFX Color',
                type: 'text',
                placeholder: '#55ff55',
                description: 'Color for VFX (hex or color name)',
                requiresFancy: true
            }
        ]
    },
    messages: {
        label: 'Messages',
        fields: [
            {
                name: 'HologramTimeout',
                label: 'Hologram Timeout',
                type: 'number',
                default: 6000,
                placeholder: '6000',
                description: 'Time in ticks before hologram disappears',
                requiresFancy: true
            },
            {
                name: 'HologramMessage',
                label: 'Hologram Message',
                type: 'textarea',
                placeholder: '&6Top Damagers:\n&e1. <trigger.damage_rank.1.name>\n&e2. <trigger.damage_rank.2.name>',
                description: 'Hologram message (supports placeholders)',
                requiresFancy: true,
                placeholders: [
                    '<trigger.damage_rank.N.name>',
                    '<trigger.damage_rank.N.uuid>',
                    '<trigger.damage_rank.N.damage>',
                    '<trigger.damage_rank.N.damagePercent>'
                ]
            },
            {
                name: 'ChatMessage',
                label: 'Chat Message',
                type: 'textarea',
                placeholder: '&6You dealt &e<trigger.damage_percent>% &6damage!',
                description: 'Chat message sent to players (supports placeholders)',
                requiresFancy: true,
                placeholders: [
                    '<trigger.damage>',
                    '<trigger.damage_percent>',
                    '<trigger.name>',
                    '<caster.name>'
                ]
            }
        ]
    }
};

// Helper function to get all DropOptions fields
function getAllDropOptionsFields() {
    const fields = {};
    Object.values(DROP_OPTIONS_CONFIG).forEach(section => {
        if (section.fields) {
            section.fields.forEach(field => {
                fields[field.name] = field;
            });
        }
    });
    return fields;
}

// Helper function to check if a field requires fancy mode
function requiresFancyMode(fieldName) {
    const allFields = getAllDropOptionsFields();
    const field = allFields.find(f => f.name === fieldName);
    return field?.requiresFancy || false;
}

window.DROP_OPTIONS_CONFIG = DROP_OPTIONS_CONFIG;
window.getAllDropOptionsFields = getAllDropOptionsFields;
window.requiresFancyMode = requiresFancyMode;
