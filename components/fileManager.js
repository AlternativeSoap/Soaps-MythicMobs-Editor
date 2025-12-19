/**
 * File Manager - Handles file operations
 */
class FileManager {
    constructor(editor) {
        this.editor = editor;
        this.mobCounter = 0;
        this.skillCounter = 0;
        this.itemCounter = 0;
        this.droptableCounter = 0;
        this.randomspawnCounter = 0;
    }
    
    /**
     * Create a new mob
     * @param {string} name - Internal name for the mob
     * @param {Object} options - Optional creation options
     * @param {string} options.template - Template mob name to inherit from
     * @param {boolean} options.isTemplate - Whether this mob is intended as a template for others
     * @param {string} options.fileName - YAML file name to use
     */
    createMob(name, options = {}) {
        const { template, isTemplate, fileName } = options;
        
        // Base mob structure
        const mob = {
            id: Date.now().toString() + '_mob',
            name: name || `mob_${this.mobCounter++}`,
            template: template || '',  // Template this mob inherits from
            isTemplate: isTemplate || false,  // Mark if this is a template for others
            // Only set defaults if NOT using a template
            type: template ? '' : 'ZOMBIE',
            display: template ? '' : '&6Custom Mob',
            health: template ? undefined : 100,
            damage: template ? undefined : 10,
            armor: template ? undefined : 0,
            movementSpeed: template ? undefined : 0.3,
            followRange: template ? undefined : 32,
            knockbackResistance: undefined,
            attackSpeed: undefined,
            // Options - only set defaults if not using template
            silent: false,
            invisible: false,
            noAI: false,
            noGravity: false,
            collidable: true,
            invincible: false,
            glowing: false,
            preventOtherDrops: false,
            preventRandomEquipment: false,
            // Complex sections - always start empty
            equipment: {},
            skills: [],
            drops: [],
            bossBar: null,
            faction: '',
            aiGoalSelectors: [],
            aiTargetSelectors: [],
            damageModifiers: {},
            killMessages: [],
            modules: {},
            levelModifiers: {}
        };
        
        // Clean up undefined values
        Object.keys(mob).forEach(key => {
            if (mob[key] === undefined) {
                delete mob[key];
            }
        });
        
        this.editor.packManager.addFile(mob, 'mob', fileName, true);
        return mob;
    }
    
    /**
     * Create a child mob from a template
     * @param {string} name - Internal name for the child mob
     * @param {string} templateName - Name of the template mob to inherit from
     */
    createChildMob(name, templateName) {
        return this.createMob(name, { template: templateName });
    }
    
    /**
     * Create a template mob (base mob that others can inherit from)
     * @param {string} name - Internal name for the template mob
     */
    createTemplateMob(name) {
        return this.createMob(name, { isTemplate: true });
    }
    
    createSkill(name, fileName = null) {
        const skill = {
            id: Date.now().toString() + '_skill',
            name: name || `skill_${this.skillCounter++}`,
            cooldown: 0,
            conditions: [],
            mechanics: []
        };
        
        this.editor.packManager.addFile(skill, 'skill', fileName, true);
        return skill;
    }
    
    createItem(name, fileName = null) {
        // Sanitize the name
        const sanitizedName = name ? this.editor.sanitizeInternalName(name) : `item_${this.itemCounter++}`;
        const item = {
            id: Date.now().toString() + '_item',
            internalName: sanitizedName,
            Id: 'DIAMOND_SWORD',
            Display: '&bCustom Item',
            Amount: 1,
            Lore: [],
            Enchantments: [],
            Attributes: {},
            PotionEffects: [],
            Options: {},
            Hide: [],
            NBT: {},
            BannerLayers: [],
            Firework: {},
            Trim: {},
            Book: {},
            Skills: []
        };
        
        this.editor.packManager.addFile(item, 'item', fileName, true);
        return item;
    }
    
    createDropTable(name, fileName = null) {
        const droptable = {
            id: Date.now().toString() + '_droptable',
            name: name || `droptable_${this.droptableCounter++}`,
            drops: []
        };
        
        this.editor.packManager.addFile(droptable, 'droptable', fileName, true);
        return droptable;
    }
    
    createRandomSpawn(name, fileName = null) {
        const spawn = {
            id: Date.now().toString() + '_randomspawn',
            name: name || `spawn_${this.randomspawnCounter++}`,
            mobType: '',
            chance: 1.0,
            priority: 0,
            conditions: [],
            action: 'REPLACE'
        };
        
        this.editor.packManager.addFile(spawn, 'randomspawn', fileName, true);
        return spawn;
    }
    
    /**
     * Create an empty file without any entries
     * Used when user wants to add entries manually in the editor
     */
    createEmptyFile(type, fileName) {
        this.editor.packManager.createEmptyFile(type, fileName);
    }
    
    saveFile(file, type) {
        // File is already in pack, just need to save packs
        this.editor.packManager.savePacks();
    }
    
    deleteFile(fileId, type) {
        return this.editor.packManager.removeFile(fileId, type);
    }
}

window.FileManager = FileManager;
