// Mob Data - Default values and templates
const MobData = {
    defaults: {
        ZOMBIE: { health: 20, damage: 3, armor: 2, speed: 0.23 },
        SKELETON: { health: 20, damage: 4, armor: 0, speed: 0.25 },
        CREEPER: { health: 20, damage: 49, armor: 0, speed: 0.25 },
        SPIDER: { health: 16, damage: 2, armor: 0, speed: 0.3 },
        ENDERMAN: { health: 40, damage: 7, armor: 0, speed: 0.3 }
    },
    
    templates: {
        basic_warrior: {
            type: 'ZOMBIE',
            display: '&6Basic Warrior',
            health: 100,
            damage: 15,
            armor: 10
        },
        boss: {
            type: 'WITHER_SKELETON',
            display: '&4&lBOSS NAME',
            health: 500,
            damage: 30,
            armor: 20
        }
    }
};

window.MobData = MobData;
