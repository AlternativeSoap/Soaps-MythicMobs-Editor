/**
 * MythicMobs Condition Actions
 * Defines the action modifiers that can be applied to conditions
 * Based on official MythicMobs documentation
 */

const CONDITION_ACTIONS = [
    {
        id: 'true',
        name: 'True',
        description: 'Skill runs if condition is met (default behavior)',
        syntax: 'true',
        example: '- health{h=>50} true'
    },
    {
        id: 'false',
        name: 'False',
        description: 'Skill runs if condition is NOT met',
        syntax: 'false',
        example: '- health{h=<20} false'
    },
    {
        id: 'power',
        name: 'Power',
        description: 'Multiplies the skill power if condition is met',
        syntax: 'power [multiplier]',
        example: '- health{h=>75} power 2.0',
        attributes: [
            {
                name: 'multiplier',
                type: 'number',
                required: true,
                description: 'The power multiplier to apply',
                placeholder: '2.0'
            }
        ]
    },
    {
        id: 'cast',
        name: 'Cast',
        description: 'Casts an additional skill if condition is met',
        syntax: 'cast [skill]',
        example: '- health{h=<25} cast EmergencyHeal',
        attributes: [
            {
                name: 'skill',
                type: 'text',
                required: true,
                description: 'The skill to cast',
                placeholder: 'EmergencyHeal'
            }
        ]
    },
    {
        id: 'castinstead',
        name: 'Cast Instead',
        description: 'Casts a different skill instead if condition is met',
        syntax: 'castinstead [skill]',
        example: '- playerwithin{d=5} castinstead MeleeAttack',
        attributes: [
            {
                name: 'skill',
                type: 'text',
                required: true,
                description: 'The skill to cast instead',
                placeholder: 'MeleeAttack'
            }
        ]
    },
    {
        id: 'orelsecast',
        name: 'Or Else Cast',
        description: 'Casts a different skill if condition is NOT met',
        syntax: 'orElseCast [skill]',
        example: '- playerwithin{d=10} orElseCast RangedAttack',
        attributes: [
            {
                name: 'skill',
                type: 'text',
                required: true,
                description: 'The skill to cast if condition fails',
                placeholder: 'RangedAttack'
            }
        ]
    },
    {
        id: 'cancel',
        name: 'Cancel',
        description: 'Cancels the entire skill tree if condition is met',
        syntax: 'cancel',
        example: '- variableEquals{var=target.immune;value="yes"} cancel'
    }
];

// Export
window.CONDITION_ACTIONS = CONDITION_ACTIONS;
// Loaded silently
