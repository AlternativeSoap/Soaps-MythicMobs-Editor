// Templates - Pre-built examples
const Templates = {
    mobs: {
        basic_zombie: {
            name: 'basic_zombie',
            type: 'ZOMBIE',
            display: '&2Basic Zombie',
            health: 50,
            damage: 8
        }
    },
    skills: {
        fireball: {
            name: 'Fireball',
            cooldown: 5,
            mechanics: [
                { type: 'projectile', params: { onTick: 'FireballParticles', onHit: 'FireballDamage' } }
            ]
        }
    },
    items: {
        magic_sword: {
            name: 'magic_sword',
            material: 'DIAMOND_SWORD',
            display: '&b&lMagic Sword',
            lore: ['&7A powerful blade', '&7infused with magic']
        }
    },
    randomspawns: {
        basic_spawn: {
            name: 'basic_spawn',
            Action: 'ADD',
            Type: 'SkeletonKing',
            Level: 1,
            Chance: 0.1,
            Priority: 1,
            UseWorldScaling: false,
            Worlds: [],
            Biomes: [],
            Reason: 'NATURAL',
            PositionType: 'LAND',
            Cooldown: 0,
            Structures: [],
            Conditions: []
        }
    }
};

window.Templates = Templates;
