/**
 * Audience Documentation for MythicMobs Mechanics
 * Based on MythicMobs wiki: https://git.mythiccraft.io/mythiccraft/MythicMobs/-/wikis/Skills/Audience
 */

const AUDIENCE_TYPES = [
    {
        id: 'self',
        aliases: ['caster'],
        name: 'Self / Caster',
        description: 'Only the skill caster can see the mechanic (e.g., particle effects)',
        example: 'audience=self',
        useCase: 'Personal visual effects, UI indicators visible only to the caster'
    },
    {
        id: 'nonSelfWorld',
        aliases: [],
        name: 'Non-Self World',
        description: 'Everyone except the caster can see the mechanic',
        example: 'audience=nonSelfWorld',
        useCase: 'Hide visual effects from the caster but show to all other players'
    },
    {
        id: 'target',
        aliases: [],
        name: 'Target',
        description: 'Only the target(s) of the skill can see the mechanic',
        example: 'audience=target',
        useCase: 'Personal indicators for affected players, damage numbers'
    },
    {
        id: 'world',
        aliases: [],
        name: 'World',
        description: 'Everyone in the world can see the mechanic (default behavior)',
        example: 'audience=world',
        useCase: 'Public visual effects visible to all players nearby'
    },
    {
        id: 'tracked',
        aliases: [],
        name: 'Tracked',
        description: 'Only players who have this entity tracked can see the mechanic (requires entity tracking)',
        example: 'audience=tracked',
        useCase: 'Show effects to players actively tracking/targeting the entity'
    },
    {
        id: 'nearby',
        aliases: [],
        name: 'Nearby',
        description: 'Players within a certain range can see the mechanic (requires range parameter)',
        example: 'audience=nearby{range=20}',
        useCase: 'Localized effects that only render for players in proximity'
    },
    {
        id: '@Targeter',
        aliases: [],
        name: 'Custom Targeter',
        description: 'Use any targeter to specify exactly who can see the mechanic',
        example: 'audience=@PlayersInRadius{r=30}',
        useCase: 'Advanced control - target players by condition, location, or state'
    }
];

const AUDIENCE_MECHANICS = [
    'particles',
    'effect:particles',
    'particlebox',
    'particleline',
    'particleorbital',
    'particlering',
    'particlesphere',
    'particletornado',
    'blockwave',
    'hologram',
    'totem'
];

const AUDIENCE_EXAMPLES = [
    {
        title: 'Personal Hit Indicator',
        code: `Skills:
- particles{particle=crit;amount=10;audience=self} @self ~onAttack`,
        description: 'Only the attacker sees crit particles when they hit'
    },
    {
        title: 'Public Boss Ability',
        code: `Skills:
- particles{particle=flame;amount=100;audience=world} @self
- damage{amount=50} @PlayersInRadius{r=5}`,
        description: 'Everyone sees the flame particles when boss uses AOE attack'
    },
    {
        title: 'Private Warning',
        code: `Skills:
- particles{particle=portal;amount=20;audience=target} @trigger
- message{msg="You are cursed!"} @trigger`,
        description: 'Only the cursed player sees purple particles around themselves'
    },
    {
        title: 'Nearby Visual Effect',
        code: `Skills:
- particleline{particle=electric;audience=nearby{range=25}} @target`,
        description: 'Lightning effect visible only to players within 25 blocks'
    }
];

// Export for global access
window.AudienceDocumentation = {
    AUDIENCE_TYPES,
    AUDIENCE_MECHANICS,
    AUDIENCE_EXAMPLES
};

// Loaded silently
