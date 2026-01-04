/**
 * MythicMobs Targeters Data
 * Complete metadata for ~50 targeters organized by category
 */

const TARGETERS_DATA = {
    // Category definitions
    categories: {
        single_entity: { name: 'Single Entity', color: '#3b82f6', icon: '👤' },
        multi_entity: { name: 'Multi Entity', color: '#10b981', icon: '👥' },
        location_single: { name: 'Single Location', color: '#f59e0b', icon: '📍' },
        location_multi: { name: 'Multi Location', color: '#eab308', icon: '🗺️' },
        meta_entity: { name: 'Meta Entity', color: '#8b5cf6', icon: '🔗' },
        meta_location: { name: 'Meta Location', color: '#ec4899', icon: '🔗' },
        threat_table: { name: 'Threat Table', color: '#ef4444', icon: '⚔️' },
        special: { name: 'Special', color: '#06b6d4', icon: '✨' }
    },

    // All targeters with complete metadata
    targeters: [
        // SINGLE ENTITY TARGETERS
        {
            id: 'Self',
            name: 'Self',
            aliases: ['Caster', 'Boss', 'Mob'],
            category: 'single_entity',
            description: 'Targets the caster of the mechanic',
            attributes: [],
            examples: ['@Self', '@Caster'],
            requirements: []
        },
        {
            id: 'Target',
            name: 'Target',
            aliases: ['T'],
            category: 'single_entity',
            description: "Targets the caster's target",
            attributes: [],
            examples: ['@Target', '@T'],
            requirements: []
        },
        {
            id: 'Trigger',
            name: 'Trigger',
            aliases: [],
            category: 'single_entity',
            description: 'Targets the entity that triggered the skill',
            attributes: [],
            examples: ['@Trigger'],
            requirements: []
        },
        {
            id: 'NearestPlayer',
            name: 'NearestPlayer',
            aliases: [],
            category: 'single_entity',
            description: 'Targets the nearest player in radius',
            attributes: [
                { name: 'radius', alias: 'r', type: 'number', default: 5, required: false, description: 'The radius to search for players' }
            ],
            examples: ['@NearestPlayer', '@NearestPlayer{r=10}'],
            requirements: []
        },
        {
            id: 'WolfOwner',
            name: 'WolfOwner',
            aliases: [],
            category: 'single_entity',
            description: 'Targets the vanilla owner of the caster, if the caster is a wolf',
            attributes: [],
            examples: ['@WolfOwner'],
            requirements: []
        },
        {
            id: 'Owner',
            name: 'Owner',
            aliases: [],
            category: 'single_entity',
            description: 'Targets the Owner of the casting mob (set via SetOwner mechanic)',
            attributes: [],
            examples: ['@Owner'],
            requirements: []
        },
        {
            id: 'Parent',
            name: 'Parent',
            aliases: ['summoner'],
            category: 'single_entity',
            description: 'Targets the Parent of the casting mob',
            attributes: [],
            examples: ['@Parent', '@summoner'],
            requirements: []
        },
        {
            id: 'Mount',
            name: 'Mount',
            aliases: [],
            category: 'single_entity',
            description: "Targets the caster's original mount",
            attributes: [],
            examples: ['@Mount'],
            requirements: []
        },
        {
            id: 'Father',
            name: 'Father',
            aliases: ['dad', 'daddy'],
            category: 'single_entity',
            description: 'Targets the father of the casting mob',
            attributes: [],
            examples: ['@Father'],
            requirements: []
        },
        {
            id: 'Mother',
            name: 'Mother',
            aliases: ['mom', 'mommy'],
            category: 'single_entity',
            description: 'Targets the mother of the casting mob',
            attributes: [],
            examples: ['@Mother'],
            requirements: []
        },
        {
            id: 'Passenger',
            name: 'Passenger',
            aliases: ['rider'],
            category: 'single_entity',
            description: 'Targets the rider of the casting mob',
            attributes: [],
            examples: ['@Passenger'],
            requirements: []
        },
        {
            id: 'PlayerByName',
            name: 'PlayerByName',
            aliases: ['specificplayer'],
            category: 'single_entity',
            description: 'Targets a specific player by their name. Can be a placeholder.',
            attributes: [
                { name: 'name', alias: 'n', type: 'string', default: 'CarsonJF', required: true, description: 'The name of the player' }
            ],
            examples: ['@PlayerByName{name=Notch}', '@PlayerByName{n=<caster.var.targetedplayer>}'],
            requirements: []
        },
        {
            id: 'UniqueIdentifier',
            name: 'UniqueIdentifier',
            aliases: ['UUID', 'uuid'],
            category: 'single_entity',
            description: 'Targets a specific entity by their UUID. Can be a placeholder.',
            attributes: [
                { name: 'uuid', alias: 'u', type: 'string', default: '0', required: true, description: 'The UUID of the entity' }
            ],
            examples: ['@UniqueIdentifier{uuid=<caster.var.targetedentity>}'],
            requirements: []
        },
        {
            id: 'Vehicle',
            name: 'Vehicle',
            aliases: [],
            category: 'single_entity',
            description: "Targets the caster's vehicle",
            attributes: [],
            examples: ['@Vehicle'],
            requirements: []
        },
        {
            id: 'InteractionLastAttacker',
            name: 'InteractionLastAttacker',
            aliases: ['lastAttacker'],
            category: 'single_entity',
            description: 'Targets the last entity that attacked the casting INTERACTION entity',
            attributes: [],
            examples: ['@InteractionLastAttacker'],
            requirements: []
        },
        {
            id: 'InteractionLastInteract',
            name: 'InteractionLastInteract',
            aliases: ['lastInteract'],
            category: 'single_entity',
            description: 'Targets the last entity that interacted with the casting INTERACTION entity',
            attributes: [],
            examples: ['@InteractionLastInteract'],
            requirements: []
        },

        // MULTI ENTITY TARGETERS
        {
            id: 'LivingInCone',
            name: 'LivingInCone',
            aliases: ['entitiesInCone', 'livingEntitiesInCone', 'LEIC', 'EIC'],
            category: 'multi_entity',
            description: 'Targets all living entities in cone with a specified angle, length and rotation',
            attributes: [
                { name: 'angle', alias: 'a', type: 'number', default: 90, required: false, description: 'The angle of the cone' },
                { name: 'range', alias: 'r', type: 'number', default: 16, required: false, description: 'The length of the cone' },
                { name: 'rotation', alias: 'rot', type: 'number', default: 0, required: false, description: 'The rotation of the cone' },
                { name: 'usepitch', alias: ['pitch', 'p'], type: 'boolean', default: false, required: false, description: "Whether to use the caster's pitch" },
                { name: 'yoffset', alias: 'yo', type: 'number', default: 0, required: false, description: 'Y offset for the cone location' },
                { name: 'livingonly', alias: 'lo', type: 'boolean', default: true, required: false, description: 'Whether to target only living entities' }
            ],
            examples: ['@LivingInCone{a=45;r=20}', '@EIC{angle=90;range=10}'],
            requirements: []
        },
        {
            id: 'LivingInWorld',
            name: 'LivingInWorld',
            aliases: ['EIW', 'allinworld', 'livingentitiesinworld', 'entitiesinworld'],
            category: 'multi_entity',
            description: "Targets all living entities in the caster's world",
            attributes: [],
            examples: ['@LivingInWorld', '@EIW'],
            requirements: []
        },
        {
            id: 'NotLivingNearOrigin',
            name: 'NotLivingNearOrigin',
            aliases: ['nonLivingNearOrigin', 'NLNO'],
            category: 'multi_entity',
            description: 'Targets all non living entities in a radius near the origin',
            attributes: [
                { name: 'radius', alias: 'r', type: 'number', default: 5, required: false, description: 'The radius of the targeter' }
            ],
            examples: ['@NotLivingNearOrigin{r=10}'],
            requirements: []
        },
        {
            id: 'PlayersInRadius',
            name: 'PlayersInRadius',
            aliases: ['PIR'],
            category: 'multi_entity',
            description: 'Targets all players in the given radius around the caster',
            attributes: [
                { name: 'radius', alias: 'r', type: 'number', default: 5, required: false, description: 'The radius of the targeter' }
            ],
            examples: ['@PlayersInRadius{r=10}', '@PIR{r=5}'],
            requirements: []
        },
        {
            id: 'MobsInRadius',
            name: 'MobsInRadius',
            aliases: ['MIR', 'mobs'],
            category: 'multi_entity',
            description: 'Targets all MythicMobs or vanilla overrides of the given type(s) in a radius',
            attributes: [
                { name: 'radius', alias: 'r', type: 'number', default: 5, required: false, description: 'The radius of the targeter' },
                { name: 'types', alias: ['type', 't'], type: 'string', default: '', required: false, description: 'The type(s) of MythicMobs (comma-separated)' },
                { name: 'checkiftemplate', alias: 'cit', type: 'boolean', default: false, required: false, description: "Check against mob's templates" }
            ],
            examples: ['@MobsInRadius{r=10;types=Zombie,Skeleton}', '@MIR{r=5}'],
            requirements: []
        },
        {
            id: 'EntitiesInRadius',
            name: 'EntitiesInRadius',
            aliases: ['livingEntitiesInRadius', 'livingInRadius', 'allInRadius', 'EIR', 'entitiesnearby', 'nearbyentities'],
            category: 'multi_entity',
            description: 'Targets all entities in the given radius around the caster',
            attributes: [
                { name: 'radius', alias: 'r', type: 'number', default: 5, required: false, description: 'The radius of the targeter' },
                { name: 'shape', alias: '', type: 'string', default: 'SPHERE', required: false, description: 'The shape to fetch entities' },
                { name: 'livingonly', alias: ['living', 'l'], type: 'boolean', default: true, required: false, description: 'Target only living entities' }
            ],
            examples: ['@EntitiesInRadius{r=10}', '@EIR{r=5;livingonly=false}'],
            requirements: []
        },
        {
            id: 'EntitiesInRing',
            name: 'EntitiesInRing',
            aliases: ['EIRR'],
            category: 'multi_entity',
            description: 'Targets all entities in a ring around the caster',
            attributes: [
                { name: 'minrange', alias: 'min', type: 'number', default: 5, required: false, description: 'The minimum range of the ring' },
                { name: 'maxrange', alias: 'max', type: 'number', default: 10, required: false, description: 'The maximum range of the ring' }
            ],
            examples: ['@EntitiesInRing{min=2;max=10}', '@EIRR{min=5;max=15}'],
            requirements: []
        },
        {
            id: 'EntitiesInRingNearOrigin',
            name: 'EntitiesInRingNearOrigin',
            aliases: ['ERNO'],
            category: 'multi_entity',
            description: 'Targets all entities in a ring near the origin',
            attributes: [
                { name: 'minrange', alias: 'min', type: 'number', default: 5, required: false, description: 'The minimum range of the ring' },
                { name: 'maxrange', alias: 'max', type: 'number', default: 10, required: false, description: 'The maximum range of the ring' }
            ],
            examples: ['@EntitiesInRingNearOrigin{min=2;max=10}'],
            requirements: []
        },
        {
            id: 'PlayersInWorld',
            name: 'PlayersInWorld',
            aliases: ['World'],
            category: 'multi_entity',
            description: "Targets all players in the caster's world",
            attributes: [],
            examples: ['@PlayersInWorld', '@World'],
            requirements: []
        },
        {
            id: 'PlayersOnServer',
            name: 'PlayersOnServer',
            aliases: ['Server', 'Everyone'],
            category: 'multi_entity',
            description: 'Targets all players on the server',
            attributes: [],
            examples: ['@PlayersOnServer', '@Server', '@Everyone'],
            requirements: []
        },
        {
            id: 'PlayersInRing',
            name: 'PlayersInRing',
            aliases: [],
            category: 'multi_entity',
            description: 'Target all players between the specified min and max radius',
            attributes: [
                { name: 'minrange', alias: 'min', type: 'number', default: 5, required: false, description: 'The minimum range' },
                { name: 'maxrange', alias: 'max', type: 'number', default: 10, required: false, description: 'The maximum range' }
            ],
            examples: ['@PlayersInRing{min=5;max=10}'],
            requirements: []
        },
        {
            id: 'PlayersNearOrigin',
            name: 'PlayersNearOrigin',
            aliases: ['PNO'],
            category: 'multi_entity',
            description: 'Targets players near the origin of a meta-skill',
            attributes: [
                { name: 'radius', alias: 'r', type: 'number', default: 5, required: false, description: 'The radius of the targeter' }
            ],
            examples: ['@PlayersNearOrigin{r=10}', '@PNO{r=5}'],
            requirements: []
        },
        {
            id: 'TrackedPlayers',
            name: 'TrackedPlayers',
            aliases: ['tracked'],
            category: 'multi_entity',
            description: 'Targets players within the render distance of the caster',
            attributes: [],
            examples: ['@TrackedPlayers'],
            requirements: []
        },
        {
            id: 'MobsNearOrigin',
            name: 'MobsNearOrigin',
            aliases: [],
            category: 'multi_entity',
            description: 'Targets all MythicMobs or vanilla overrides of the given type(s) near the origin',
            attributes: [
                { name: 'radius', alias: 'r', type: 'number', default: 5, required: false, description: 'The radius of the targeter' },
                { name: 'types', alias: ['type', 't'], type: 'string', default: '', required: false, description: 'The type(s) of MythicMobs' }
            ],
            examples: ['@MobsNearOrigin{r=10;types=Zombie}'],
            requirements: []
        },
        {
            id: 'EntitiesNearOrigin',
            name: 'EntitiesNearOrigin',
            aliases: ['ENO'],
            category: 'multi_entity',
            description: 'Targets all entities near the origin of a meta-skill',
            attributes: [
                { name: 'radius', alias: 'r', type: 'number', default: 5, required: false, description: 'The radius of the targeter' }
            ],
            examples: ['@EntitiesNearOrigin{r=10}', '@ENO{r=5}'],
            requirements: []
        },
        {
            id: 'Children',
            name: 'Children',
            aliases: ['child', 'summons'],
            category: 'multi_entity',
            description: 'Targets any child entities summoned by the caster',
            attributes: [],
            examples: ['@Children', '@summons'],
            requirements: []
        },
        {
            id: 'Siblings',
            name: 'Siblings',
            aliases: ['sibling', 'brothers', 'sisters'],
            category: 'multi_entity',
            description: 'Targets any mobs that share the same parent as the caster',
            attributes: [],
            examples: ['@Siblings'],
            requirements: []
        },
        {
            id: 'ItemsNearOrigin',
            name: 'ItemsNearOrigin',
            aliases: [],
            category: 'multi_entity',
            description: 'Targets item drops near the origin of a meta-skill',
            attributes: [
                { name: 'radius', alias: 'r', type: 'number', default: 5, required: false, description: 'The radius of the targeter' }
            ],
            examples: ['@ItemsNearOrigin{r=10}'],
            requirements: []
        },
        {
            id: 'ItemsInRadius',
            name: 'ItemsInRadius',
            aliases: ['IIR'],
            category: 'multi_entity',
            description: 'Targets all item drops in the given radius',
            attributes: [
                { name: 'radius', alias: 'r', type: 'number', default: 5, required: false, description: 'The radius of the targeter' }
            ],
            examples: ['@ItemsInRadius{r=10}', '@IIR{r=5}'],
            requirements: []
        },

        // THREAT TABLE TARGETERS
        {
            id: 'ThreatTable',
            name: 'ThreatTable',
            aliases: ['TT'],
            category: 'threat_table',
            description: "Targets every entity on the casting mob's threat table",
            attributes: [],
            examples: ['@ThreatTable', '@TT'],
            requirements: ['ThreatTable']
        },
        {
            id: 'ThreatTablePlayers',
            name: 'ThreatTablePlayers',
            aliases: [],
            category: 'threat_table',
            description: "Targets all players on the casting mob's threat table",
            attributes: [],
            examples: ['@ThreatTablePlayers'],
            requirements: ['ThreatTable']
        },
        {
            id: 'RandomThreatTarget',
            name: 'RandomThreatTarget',
            aliases: ['RTT'],
            category: 'threat_table',
            description: "Targets a random entity on the casting mob's threat table",
            attributes: [],
            examples: ['@RandomThreatTarget', '@RTT'],
            requirements: ['ThreatTable']
        },
        {
            id: 'RandomThreatTargetLocation',
            name: 'RandomThreatTargetLocation',
            aliases: ['RTTL'],
            category: 'threat_table',
            description: "Targets the location of a random entity on the threat table",
            attributes: [],
            examples: ['@RandomThreatTargetLocation'],
            requirements: ['ThreatTable']
        },

        // SINGLE LOCATION TARGETERS
        {
            id: 'SelfLocation',
            name: 'SelfLocation',
            aliases: ['casterLocation', 'bossLocation', 'mobLocation'],
            category: 'location_single',
            description: "Targets the caster's location",
            attributes: [],
            examples: ['@SelfLocation', '@casterLocation'],
            requirements: []
        },
        {
            id: 'SelfEyeLocation',
            name: 'SelfEyeLocation',
            aliases: ['eyeDirection', 'casterEyeLocation', 'bossEyeLocation', 'mobEyeLocation'],
            category: 'location_single',
            description: "Targets the caster's eye location",
            attributes: [],
            examples: ['@SelfEyeLocation'],
            requirements: []
        },
        {
            id: 'Forward',
            name: 'Forward',
            aliases: [],
            category: 'location_single',
            description: "Targets a location in front of caster's facing direction",
            attributes: [
                { name: 'distance', alias: 'd', type: 'number', default: 5, required: false, description: 'Distance forward' }
            ],
            examples: ['@Forward', '@Forward{d=10}'],
            requirements: []
        },
        {
            id: 'ProjectileForward',
            name: 'ProjectileForward',
            aliases: [],
            category: 'location_single',
            description: 'Targets a location in front of the casting projectile',
            attributes: [
                { name: 'distance', alias: 'd', type: 'number', default: 5, required: false, description: 'Distance forward' }
            ],
            examples: ['@ProjectileForward{d=10}'],
            requirements: []
        },
        {
            id: 'TargetLocation',
            name: 'TargetLocation',
            aliases: ['targetloc', 'TL'],
            category: 'location_single',
            description: "Targets the caster's target's location",
            attributes: [],
            examples: ['@TargetLocation', '@TL'],
            requirements: []
        },
        {
            id: 'TriggerLocation',
            name: 'TriggerLocation',
            aliases: [],
            category: 'location_single',
            description: 'Targets the location of the entity that triggered the skill',
            attributes: [],
            examples: ['@TriggerLocation'],
            requirements: []
        },
        {
            id: 'Origin',
            name: 'Origin',
            aliases: ['source'],
            category: 'location_single',
            description: 'Targets the location of the origin or source of a meta-skill',
            attributes: [],
            examples: ['@Origin', '@source'],
            requirements: []
        },
        {
            id: 'Location',
            name: 'Location',
            aliases: [],
            category: 'location_single',
            description: "Targets the specified coordinates in the caster's world",
            attributes: [
                { name: 'x', alias: '', type: 'number', default: 0, required: true, description: 'X coordinate' },
                { name: 'y', alias: '', type: 'number', default: 0, required: true, description: 'Y coordinate' },
                { name: 'z', alias: '', type: 'number', default: 0, required: true, description: 'Z coordinate' }
            ],
            examples: ['@Location{x=100;y=64;z=200}'],
            requirements: []
        },
        {
            id: 'SpawnLocation',
            name: 'SpawnLocation',
            aliases: [],
            category: 'location_single',
            description: "Targets the world's spawn location",
            attributes: [],
            examples: ['@SpawnLocation'],
            requirements: []
        },
        {
            id: 'CasterSpawnLocation',
            name: 'CasterSpawnLocation',
            aliases: [],
            category: 'location_single',
            description: 'Targets the location the caster spawned at',
            attributes: [],
            examples: ['@CasterSpawnLocation'],
            requirements: []
        },
        {
            id: 'VariableLocation',
            name: 'VariableLocation',
            aliases: ['varLocation'],
            category: 'location_single',
            description: 'Targets the location stored in the specified variable',
            attributes: [
                { name: 'var', alias: 'variable', type: 'string', default: '', required: true, description: 'The variable name' }
            ],
            examples: ['@VariableLocation{var=target.storedloc}'],
            requirements: []
        },
        {
            id: 'TargetPredictedLocation',
            name: 'TargetPredictedLocation',
            aliases: [],
            category: 'location_single',
            description: 'Targets the predicted location of the target based on velocity',
            attributes: [
                { name: 'ticks', alias: 't', type: 'integer', default: '20', required: false, description: 'Ticks ahead to predict' }
            ],
            examples: ['@TargetPredictedLocation{t=10}'],
            requirements: []
        },
        {
            id: 'ObstructingBlock',
            name: 'ObstructingBlock',
            aliases: [],
            category: 'location_single',
            description: 'Targets the block that is obstructing the line of sight',
            attributes: [],
            examples: ['@ObstructingBlock'],
            requirements: []
        },
        {
            id: 'TargetBlock',
            name: 'TargetBlock',
            aliases: [],
            category: 'location_single',
            description: 'Targets the block at the target location',
            attributes: [],
            examples: ['@TargetBlock'],
            requirements: []
        },
        {
            id: 'NearestStructure',
            name: 'NearestStructure',
            aliases: [],
            category: 'location_single',
            description: 'Targets the nearest structure of the specified type',
            attributes: [
                { name: 'structure', alias: 's', type: 'string', default: '', required: true, description: 'Structure type to find' },
                { name: 'radius', alias: 'r', type: 'integer', default: '100', required: false, description: 'Search radius' }
            ],
            examples: ['@NearestStructure{s=village;r=200}'],
            requirements: ['MC 1.16+']
        },
        {
            id: 'HighestBlock',
            name: 'HighestBlock',
            aliases: [],
            category: 'location_single',
            description: 'Targets the highest solid block at the target location',
            attributes: [],
            examples: ['@HighestBlock'],
            requirements: []
        },
        {
            id: 'PlayerLocationByName',
            name: 'PlayerLocationByName',
            aliases: [],
            category: 'location_single',
            description: 'Targets the location of a player by their username',
            attributes: [
                { name: 'name', alias: 'n', type: 'string', default: '', required: true, description: 'Player username' }
            ],
            examples: ['@PlayerLocationByName{n=Notch}'],
            requirements: []
        },
        {
            id: 'ForwardWall',
            name: 'ForwardWall',
            aliases: [],
            category: 'location_single',
            description: 'Targets the nearest wall in front of the caster',
            attributes: [
                { name: 'maxdistance', alias: 'md', type: 'float', default: '100', required: false, description: 'Maximum distance to check' }
            ],
            examples: ['@ForwardWall{md=50}'],
            requirements: []
        },

        // MULTI LOCATION TARGETERS
        {
            id: 'Ring',
            name: 'Ring',
            aliases: [],
            category: 'location_multi',
            description: 'Target points to form a ring of locations',
            attributes: [
                { name: 'radius', alias: 'r', type: 'number', default: 5, required: false, description: 'The radius of the ring' },
                { name: 'points', alias: 'p', type: 'number', default: 8, required: false, description: 'Number of points in the ring' }
            ],
            examples: ['@Ring{r=5;p=12}'],
            requirements: []
        },
        {
            id: 'Cone',
            name: 'Cone',
            aliases: [],
            category: 'location_multi',
            description: 'Returns target locations that comprise a cone',
            attributes: [
                { name: 'angle', alias: 'a', type: 'number', default: 90, required: false, description: 'The angle of the cone' },
                { name: 'range', alias: 'r', type: 'number', default: 10, required: false, description: 'The range of the cone' },
                { name: 'points', alias: 'p', type: 'number', default: 10, required: false, description: 'Number of points' }
            ],
            examples: ['@Cone{a=45;r=10;p=20}'],
            requirements: []
        },
        {
            id: 'Sphere',
            name: 'Sphere',
            aliases: [],
            category: 'location_multi',
            description: 'Targets points in a sphere around the caster',
            attributes: [
                { name: 'radius', alias: 'r', type: 'number', default: 5, required: false, description: 'The radius of the sphere' },
                { name: 'points', alias: 'p', type: 'number', default: 20, required: false, description: 'Number of points' }
            ],
            examples: ['@Sphere{r=5;p=30}'],
            requirements: []
        },
        {
            id: 'Rectangle',
            name: 'Rectangle',
            aliases: ['cube', 'cuboid'],
            category: 'location_multi',
            description: 'Returns target locations that comprise a rectangle',
            attributes: [
                { name: 'x', alias: '', type: 'number', default: 5, required: false, description: 'X size' },
                { name: 'y', alias: '', type: 'number', default: 5, required: false, description: 'Y size' },
                { name: 'z', alias: '', type: 'number', default: 5, required: false, description: 'Z size' },
                { name: 'points', alias: 'p', type: 'number', default: 20, required: false, description: 'Number of points' }
            ],
            examples: ['@Rectangle{x=10;y=5;z=10;p=30}'],
            requirements: []
        },
        {
            id: 'RandomLocationsNearCaster',
            name: 'RandomLocationsNearCaster',
            aliases: ['randomLocations', 'RLNC'],
            category: 'location_multi',
            description: 'Targets random locations near the caster',
            attributes: [
                { name: 'amount', alias: 'a', type: 'number', default: 5, required: false, description: 'The amount of points' },
                { name: 'radius', alias: 'r,maxradius,maxr', type: 'number', default: 5, required: false, description: 'The radius in which target points will be generated' },
                { name: 'minradius', alias: 'minr', type: 'number', default: 0, required: false, description: 'The minimum radius in which target points will be generated' },
                { name: 'spacing', alias: 's', type: 'number', default: 0, required: false, description: 'The minimum amount of space between selected targets' },
                { name: 'onSurface', alias: 'onsurf,os', type: 'boolean', default: false, required: false, description: 'Only target locations above solid blocks' }
            ],
            examples: ['@RandomLocationsNearCaster{a=5;r=2}'],
            requirements: []
        },
        {
            id: 'RandomLocationsNearOrigin',
            name: 'RandomLocationsNearOrigin',
            aliases: ['RLO', 'randomLocationsOrigin', 'RLNO'],
            category: 'location_multi',
            description: 'Targets random locations near the origin of a skill',
            attributes: [
                { name: 'amount', alias: 'a', type: 'number', default: 5, required: false, description: 'The amount of points' },
                { name: 'radius', alias: 'r,maxradius,maxr', type: 'number', default: 5, required: false, description: 'The radius in which target points will be generated' },
                { name: 'minradius', alias: 'minr', type: 'number', default: 0, required: false, description: 'The minimum radius in which target points will be generated' },
                { name: 'spacing', alias: 's', type: 'number', default: 0, required: false, description: 'The minimum amount of space between selected targets' },
                { name: 'onSurface', alias: 'onsurf,os', type: 'boolean', default: false, required: false, description: 'Only target locations above solid blocks' }
            ],
            examples: ['@RandomLocationsNearOrigin{a=5;r=2}'],
            requirements: []
        },
        {
            id: 'RandomLocationsNearTarget',
            name: 'RandomLocationsNearTarget',
            aliases: ['RLNT', 'RandomLocationsNearTargets'],
            category: 'location_multi',
            description: 'Targets random locations near each inherited target entity',
            attributes: [
                { name: 'amount', alias: 'a', type: 'number', default: 5, required: false, description: 'The amount of points' },
                { name: 'radius', alias: 'r,maxradius,maxr', type: 'number', default: 5, required: false, description: 'The radius in which target points will be generated' },
                { name: 'minradius', alias: 'minr', type: 'number', default: 0, required: false, description: 'The minimum radius in which target points will be generated' },
                { name: 'spacing', alias: 's', type: 'number', default: 0, required: false, description: 'The minimum amount of space between selected targets' },
                { name: 'onSurface', alias: 'onsurf,os', type: 'boolean', default: false, required: false, description: 'Only target locations above solid blocks' }
            ],
            examples: ['@RandomLocationsNearTarget{a=5;r=2}', '@RLNT{r=8;a=3;minr=2}'],
            requirements: []
        },
        {
            id: 'BlocksNearOrigin',
            name: 'BlocksNearOrigin',
            aliases: ['BNO'],
            category: 'location_multi',
            description: 'Targets all blocks in a radius around the origin of the metaskill',
            attributes: [
                { name: 'radius', alias: 'r', type: 'number', default: 5, required: false, description: 'The radius' }
            ],
            examples: ['@BlocksNearOrigin{r=10}'],
            requirements: []
        },
        {
            id: 'BlocksInRadius',
            name: 'BlocksInRadius',
            aliases: ['BIR'],
            category: 'location_multi',
            description: 'Targets all blocks in a radius around the caster',
            attributes: [
                { name: 'radius', alias: 'r', type: 'number', default: 5, required: false, description: 'The radius' },
                { name: 'radiusy', alias: 'ry', type: 'number', default: 5, required: false, description: 'The vertical radius' },
                { name: 'shape', type: 'string', default: 'sphere', required: false, description: 'Shape of the search area (sphere/cube)' }
            ],
            examples: ['@BlocksInRadius{r=5}', '@BlocksInRadius{r=10;ry=3;shape=cube}'],
            requirements: []
        },
        {
            id: 'RingAroundOrigin',
            name: 'RingAroundOrigin',
            aliases: ['ringOrigin', 'RAO'],
            category: 'location_multi',
            description: 'Targets locations in a specified ring around the origin',
            attributes: [
                { name: 'radius', alias: 'r', type: 'number', default: 5, required: false, description: 'The radius' },
                { name: 'points', alias: 'p', type: 'number', default: 8, required: false, description: 'Number of points' }
            ],
            examples: ['@RingAroundOrigin{r=5;p=12}'],
            requirements: []
        },
        {
            id: 'PlayerLocationsInRadius',
            name: 'PlayerLocationsInRadius',
            aliases: [],
            category: 'location_multi',
            description: 'Targets the locations of all players in radius',
            attributes: [
                { name: 'radius', alias: 'r', type: 'float', default: '16', required: false, description: 'Search radius' }
            ],
            examples: ['@PlayerLocationsInRadius{r=30}'],
            requirements: []
        },
        {
            id: 'Spawners',
            name: 'Spawners',
            aliases: [],
            category: 'location_multi',
            description: 'Targets all spawner blocks in radius',
            attributes: [
                { name: 'radius', alias: 'r', type: 'float', default: '16', required: false, description: 'Search radius' }
            ],
            examples: ['@Spawners{r=50}'],
            requirements: []
        },
        {
            id: 'ChunksInWERegion',
            name: 'ChunksInWERegion',
            aliases: [],
            category: 'location_multi',
            description: 'Targets chunk locations in a WorldEdit region',
            attributes: [
                { name: 'region', alias: 'r', type: 'string', default: '', required: true, description: 'WorldEdit region name' }
            ],
            examples: ['@ChunksInWERegion{r=spawn_area}'],
            requirements: ['WorldEdit', 'Premium']
        },

        // META ENTITY TARGETERS
        {
            id: 'LivingInLine',
            name: 'LivingInLine',
            aliases: ['entitiesInLine', 'livingEntitiesInLine', 'LEIL', 'EIL'],
            category: 'meta_entity',
            description: 'Targets any entities in a line between the inherited target and the casting mob',
            attributes: [
                { name: 'radius', alias: 'r', type: 'number', default: 1, required: false, description: 'The radius around the line' }
            ],
            examples: ['@LivingInLine{r=1}'],
            requirements: []
        },
        {
            id: 'LivingNearTargetLocation',
            name: 'LivingNearTargetLocation',
            aliases: ['LNTL', 'ENTL', 'ENT'],
            category: 'meta_entity',
            description: 'Targets all living entities near the inherited target',
            attributes: [
                { name: 'radius', alias: 'r', type: 'number', default: 5, required: false, description: 'The radius' }
            ],
            examples: ['@LivingNearTargetLocation{r=10}'],
            requirements: []
        },
        {
            id: 'PlayersNearTargetLocations',
            name: 'PlayersNearTargetLocations',
            aliases: [],
            category: 'meta_entity',
            description: 'Targets players near the inherited target locations',
            attributes: [
                { name: 'radius', alias: 'r', type: 'float', default: '5', required: false, description: 'Search radius' }
            ],
            examples: ['@PlayersNearTargetLocations{r=10}'],
            requirements: []
        },
        {
            id: 'TargetedTarget',
            name: 'TargetedTarget',
            aliases: [],
            category: 'meta_entity',
            description: 'Targets what the inherited target is targeting',
            attributes: [],
            examples: ['@TargetedTarget'],
            requirements: []
        },

        // META LOCATION TARGETERS - Not in docs, placeholder
        {
            id: 'FloorOfTargets',
            name: 'FloorOfTargets',
            aliases: [],
            category: 'meta_location',
            description: 'Targets the floor location below inherited targets',
            attributes: [],
            examples: ['@FloorOfTargets'],
            requirements: []
        },
        {
            id: 'LocationsOfTargets',
            name: 'LocationsOfTargets',
            aliases: [],
            category: 'meta_location',
            description: 'Targets the locations of all inherited targets',
            attributes: [],
            examples: ['@LocationsOfTargets'],
            requirements: []
        },
        {
            id: 'TargetedLocation',
            name: 'TargetedLocation',
            aliases: [],
            category: 'meta_location',
            description: 'Targets the location that the inherited target is looking at',
            attributes: [
                { name: 'maxdistance', alias: 'md', type: 'float', default: '30', required: false, description: 'Max distance to check' }
            ],
            examples: ['@TargetedLocation{md=50}'],
            requirements: []
        },
        {
            id: 'BlocksInChunk',
            name: 'BlocksInChunk',
            aliases: [],
            category: 'meta_location',
            description: 'Targets all blocks of the specified type in the chunk',
            attributes: [
                { name: 'material', alias: 'm', type: 'string', default: '', required: true, description: 'Block material' }
            ],
            examples: ['@BlocksInChunk{m=SPAWNER}'],
            requirements: []
        },
        {
            id: 'BlockVein',
            name: 'BlockVein',
            aliases: [],
            category: 'meta_location',
            description: 'Targets all connected blocks of the same type (like a vein of ore)',
            attributes: [
                { name: 'radius', alias: 'r', type: 'float', default: '5', required: false, description: 'Max search radius' }
            ],
            examples: ['@BlockVein{r=10}'],
            requirements: []
        },
        
        // SPECIAL TARGETERS
        {
            id: 'OwnerLocation',
            name: 'OwnerLocation',
            aliases: [],
            category: 'special',
            description: 'Targets the position of the owner of the mob',
            attributes: [],
            examples: ['@OwnerLocation'],
            requirements: []
        },
        {
            id: 'ParentLocation',
            name: 'ParentLocation',
            aliases: ['summonerlocation'],
            category: 'special',
            description: 'Targets the position of the parent of the mob',
            attributes: [],
            examples: ['@ParentLocation'],
            requirements: []
        },
        {
            id: 'None',
            name: 'None',
            aliases: [],
            category: 'special',
            description: 'No target, useful for clearing targets or placeholder',
            attributes: [],
            examples: ['@None'],
            requirements: []
        },
        {
            id: 'Region',
            name: 'Region',
            aliases: [],
            category: 'special',
            description: 'Targets entities within a WorldEdit region',
            attributes: [
                { name: 'region', alias: 'r', type: 'string', default: '', required: true, description: 'WorldEdit region name' }
            ],
            examples: ['@Region{r=spawn_area}'],
            requirements: ['WorldEdit', 'Premium']
        }
    ],

    /**
     * Get targeter by name or alias
     */
    getTargeter(name) {
        if (!name) return null;
        const normalized = name.toLowerCase().replace('@', '');
        return this.targeters.find(t => 
            t.name.toLowerCase() === normalized || 
            t.id.toLowerCase() === normalized ||
            t.aliases.some(a => a.toLowerCase() === normalized)
        );
    },

    /**
     * Get all targeters in a category
     */
    getTargetersByCategory(category) {
        return this.targeters.filter(t => t.category === category);
    },

    /**
     * Search targeters by query
     */
    searchTargeters(query) {
        if (!query) return this.targeters;
        const lowerQuery = query.toLowerCase();
        return this.targeters.filter(t => 
            t.name.toLowerCase().includes(lowerQuery) ||
            t.description.toLowerCase().includes(lowerQuery) ||
            t.aliases.some(a => a.toLowerCase().includes(lowerQuery))
        );
    },

    /**
     * Check if targeter requires specific modules
     */
    checkRequirements(targeter, mobModules) {
        if (!targeter.requirements || targeter.requirements.length === 0) {
            return { satisfied: true, missing: [] };
        }

        const missing = [];
        for (const req of targeter.requirements) {
            if (req === 'ThreatTable' && !mobModules?.ThreatTable) {
                missing.push(req);
            }
        }

        return {
            satisfied: missing.length === 0,
            missing: missing
        };
    }
};

// Export to window for browser usage
window.TARGETERS_DATA = TARGETERS_DATA;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TARGETERS_DATA;
}

// Loaded silently
