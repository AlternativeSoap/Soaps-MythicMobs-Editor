/**
 * Fancy Drops Configuration
 * DropOptions for mob-level fancy drop configuration
 */

const DROP_OPTIONS_CONFIG = {
    general: {
        label: 'General Settings',
        icon: 'cog',
        fields: [
            {
                name: 'DropMethod',
                label: 'Drop Method',
                type: 'select',
                default: 'VANILLA',
                options: ['VANILLA', 'FANCY'],
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
                name: 'Lootsplosion',
                label: 'Lootsplosion',
                type: 'boolean',
                default: false,
                description: 'Drops spread outward by default',
                requiresFancy: true
            },
            {
                name: 'RequiredDamagePercent',
                label: 'Required Damage %',
                type: 'number',
                min: 0,
                max: 100,
                default: 1,
                placeholder: '1',
                description: 'Minimum damage % required for drops (decimal, e.g., 0.1 = 10%)',
                requiresFancy: true
            },
            {
                name: 'HologramTimeout',
                label: 'Hologram Timeout (ticks)',
                type: 'number',
                default: 6000,
                placeholder: '6000',
                description: 'Time in ticks before hologram disappears (20 ticks = 1 second)',
                requiresFancy: true
            }
        ]
    },
    perPlayer: {
        label: 'Per-Player Drops',
        icon: 'users',
        fields: [
            {
                name: 'PerPlayerDrops',
                label: 'Per Player Drops',
                type: 'boolean',
                default: false,
                description: 'Calculate drops separately for each player',
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
        icon: 'eye',
        description: 'Default visual effects for all drops',
        fields: [
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
                description: 'Make items glow by default (WARNING: makes items unstackable!)',
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
        icon: 'magic',
        description: 'Default visual effects configuration for dropped items',
        fields: [
            {
                name: 'ItemVFX.Material',
                label: 'VFX Material',
                type: 'text',
                placeholder: 'POTION',
                description: 'Material for item VFX (e.g., POTION, DIAMOND, etc.)',
                requiresFancy: true
            },
            {
                name: 'ItemVFX.Model',
                label: 'VFX Custom Model Data',
                type: 'number',
                placeholder: '0',
                description: 'Custom model data for VFX',
                requiresFancy: true
            }
        ]
    },
    messages: {
        label: 'Messages',
        icon: 'comment',
        description: 'Customize hologram and chat messages',
        fields: [
            {
                name: 'HologramMessage',
                label: 'Hologram Message',
                type: 'stringlist',
                placeholder: '<#FF9B00>========================\n<mob.name> - <mob.hp>HP\n\n<#FFA300>1st Place | <1.name> | <1.damage>',
                description: 'Multi-line hologram message (one line per entry)',
                requiresFancy: true,
                placeholders: [
                    '<mob.name> - Mob display name',
                    '<mob.hp> - Mob max health',
                    '<N.name> - Nth place player name',
                    '<N.damage> - Nth place damage dealt',
                    '<player.rank> - Player\'s rank',
                    '<player.damage> - Player\'s damage'
                ]
            },
            {
                name: 'ChatMessage',
                label: 'Chat Message',
                type: 'stringlist',
                placeholder: '<#F28800>====================================\n<#FFA300>BOSS DEFEATED!\n<#F2B600><mob.name>',
                description: 'Multi-line chat message sent to players (one line per entry)',
                requiresFancy: true,
                placeholders: [
                    '<mob.name> - Mob display name',
                    '<N.name> - Nth place player name',
                    '<N.damage> - Nth place damage dealt',
                    '<player.rank> - Player\'s rank',
                    '<player.damage> - Player\'s damage',
                    '<pity> - Pity value'
                ]
            }
        ]
    }
};

// Helper function to get all DropOptions fields as a flat object
function getAllDropOptionsFields() {
    const fields = {};
    Object.values(DROP_OPTIONS_CONFIG).forEach(section => {
        if (section.fields) {
            section.fields.forEach(field => {
                fields[field.name] = { ...field, section: section.label, sectionIcon: section.icon };
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
