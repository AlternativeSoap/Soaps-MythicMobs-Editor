/**
 * Minecraft Item Icon System
 * Uses sprite coordinates for efficient icon display
 * Icons are 16x16 pixels from Minecraft texture atlas
 */

// Minecraft item icon sprite sheet using community CDN
// This uses the Minecraft texture atlas hosted on a public CDN
const MINECRAFT_ICON_CDN_ITEM = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21/assets/minecraft/textures/item/';
const MINECRAFT_ICON_CDN_BLOCK = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21/assets/minecraft/textures/block/';

/**
 * Get icon URL for a Minecraft item
 * @param {string} itemName - The Minecraft item ID (e.g., 'diamond_sword')
 * @returns {string} URL to the item's PNG texture
 */
function getMinecraftItemIcon(itemName) {
    // Remove any namespace prefix (minecraft:)
    const cleanName = itemName.replace('minecraft:', '').toLowerCase();
    
    // Items that use block textures instead of item textures
    const blockTextureItems = {
        // Stone variants
        'stone': 'stone',
        'granite': 'granite',
        'polished_granite': 'polished_granite',
        'diorite': 'diorite',
        'polished_diorite': 'polished_diorite',
        'andesite': 'andesite',
        'polished_andesite': 'polished_andesite',
        'deepslate': 'deepslate',
        'cobbled_deepslate': 'cobbled_deepslate',
        'polished_deepslate': 'polished_deepslate',
        'deepslate_bricks': 'deepslate_bricks',
        'deepslate_tiles': 'deepslate_tiles',
        'cobblestone': 'cobblestone',
        'mossy_cobblestone': 'mossy_cobblestone',
        'stone_bricks': 'stone_bricks',
        'mossy_stone_bricks': 'mossy_stone_bricks',
        'cracked_stone_bricks': 'cracked_stone_bricks',
        'chiseled_stone_bricks': 'chiseled_stone_bricks',
        
        // Other building blocks
        'bricks': 'bricks',
        'mud_bricks': 'mud_bricks',
        'packed_mud': 'packed_mud',
        'sandstone': 'sandstone_top',
        'chiseled_sandstone': 'chiseled_sandstone',
        'cut_sandstone': 'cut_sandstone',
        'smooth_sandstone': 'smooth_sandstone_top',
        'red_sandstone': 'red_sandstone_top',
        'chiseled_red_sandstone': 'chiseled_red_sandstone',
        'cut_red_sandstone': 'cut_red_sandstone',
        'smooth_red_sandstone': 'smooth_red_sandstone_top',
        
        // Prismarine
        'prismarine': 'prismarine',
        'prismarine_bricks': 'prismarine_bricks',
        'dark_prismarine': 'dark_prismarine',
        
        // Nether blocks
        'nether_bricks': 'nether_bricks',
        'red_nether_bricks': 'red_nether_bricks',
        'cracked_nether_bricks': 'cracked_nether_bricks',
        'chiseled_nether_bricks': 'chiseled_nether_bricks',
        'blackstone': 'blackstone',
        'polished_blackstone': 'polished_blackstone',
        'chiseled_polished_blackstone': 'chiseled_polished_blackstone',
        'gilded_blackstone': 'gilded_blackstone',
        'polished_blackstone_bricks': 'polished_blackstone_bricks',
        'cracked_polished_blackstone_bricks': 'cracked_polished_blackstone_bricks',
        
        // End blocks
        'end_stone': 'end_stone',
        'end_stone_bricks': 'end_stone_bricks',
        'purpur_block': 'purpur_block',
        'purpur_pillar': 'purpur_pillar',
        
        // Quartz
        'quartz_block': 'quartz_block_side',
        'chiseled_quartz_block': 'chiseled_quartz_block',
        'quartz_bricks': 'quartz_bricks',
        'quartz_pillar': 'quartz_pillar',
        'smooth_quartz': 'quartz_block_bottom',
        
        // Terracotta
        'terracotta': 'terracotta',
        'white_terracotta': 'white_terracotta',
        'orange_terracotta': 'orange_terracotta',
        'magenta_terracotta': 'magenta_terracotta',
        'light_blue_terracotta': 'light_blue_terracotta',
        'yellow_terracotta': 'yellow_terracotta',
        'lime_terracotta': 'lime_terracotta',
        'pink_terracotta': 'pink_terracotta',
        'gray_terracotta': 'gray_terracotta',
        'light_gray_terracotta': 'light_gray_terracotta',
        'cyan_terracotta': 'cyan_terracotta',
        'purple_terracotta': 'purple_terracotta',
        'blue_terracotta': 'blue_terracotta',
        'brown_terracotta': 'brown_terracotta',
        'green_terracotta': 'green_terracotta',
        'red_terracotta': 'red_terracotta',
        'black_terracotta': 'black_terracotta',
        
        // Concrete
        'white_concrete': 'white_concrete',
        'orange_concrete': 'orange_concrete',
        'magenta_concrete': 'magenta_concrete',
        'light_blue_concrete': 'light_blue_concrete',
        'yellow_concrete': 'yellow_concrete',
        'lime_concrete': 'lime_concrete',
        'pink_concrete': 'pink_concrete',
        'gray_concrete': 'gray_concrete',
        'light_gray_concrete': 'light_gray_concrete',
        'cyan_concrete': 'cyan_concrete',
        'purple_concrete': 'purple_concrete',
        'blue_concrete': 'blue_concrete',
        'brown_concrete': 'brown_concrete',
        'green_concrete': 'green_concrete',
        'red_concrete': 'red_concrete',
        'black_concrete': 'black_concrete',
        
        // Glazed terracotta
        'white_glazed_terracotta': 'white_glazed_terracotta',
        'orange_glazed_terracotta': 'orange_glazed_terracotta',
        'magenta_glazed_terracotta': 'magenta_glazed_terracotta',
        'light_blue_glazed_terracotta': 'light_blue_glazed_terracotta',
        'yellow_glazed_terracotta': 'yellow_glazed_terracotta',
        'lime_glazed_terracotta': 'lime_glazed_terracotta',
        'pink_glazed_terracotta': 'pink_glazed_terracotta',
        'gray_glazed_terracotta': 'gray_glazed_terracotta',
        'light_gray_glazed_terracotta': 'light_gray_glazed_terracotta',
        'cyan_glazed_terracotta': 'cyan_glazed_terracotta',
        'purple_glazed_terracotta': 'purple_glazed_terracotta',
        'blue_glazed_terracotta': 'blue_glazed_terracotta',
        'brown_glazed_terracotta': 'brown_glazed_terracotta',
        'green_glazed_terracotta': 'green_glazed_terracotta',
        'red_glazed_terracotta': 'red_glazed_terracotta',
        'black_glazed_terracotta': 'black_glazed_terracotta',
        
        // Wood planks
        'oak_planks': 'oak_planks',
        'spruce_planks': 'spruce_planks',
        'birch_planks': 'birch_planks',
        'jungle_planks': 'jungle_planks',
        'acacia_planks': 'acacia_planks',
        'dark_oak_planks': 'dark_oak_planks',
        'mangrove_planks': 'mangrove_planks',
        'cherry_planks': 'cherry_planks',
        'bamboo_planks': 'bamboo_planks',
        'bamboo_mosaic': 'bamboo_mosaic',
        
        // Logs (use top texture)
        'oak_log': 'oak_log_top',
        'spruce_log': 'spruce_log_top',
        'birch_log': 'birch_log_top',
        'jungle_log': 'jungle_log_top',
        'acacia_log': 'acacia_log_top',
        'dark_oak_log': 'dark_oak_log_top',
        'mangrove_log': 'mangrove_log_top',
        'cherry_log': 'cherry_log_top',
        'stripped_oak_log': 'stripped_oak_log_top',
        'stripped_spruce_log': 'stripped_spruce_log_top',
        'stripped_birch_log': 'stripped_birch_log_top',
        'stripped_jungle_log': 'stripped_jungle_log_top',
        'stripped_acacia_log': 'stripped_acacia_log_top',
        'stripped_dark_oak_log': 'stripped_dark_oak_log_top',
        'stripped_mangrove_log': 'stripped_mangrove_log_top',
        'stripped_cherry_log': 'stripped_cherry_log_top',
        
        // Wood (bark all around)
        'oak_wood': 'oak_log',
        'spruce_wood': 'spruce_log',
        'birch_wood': 'birch_log',
        'jungle_wood': 'jungle_log',
        'acacia_wood': 'acacia_log',
        'dark_oak_wood': 'dark_oak_log',
        'mangrove_wood': 'mangrove_log',
        'cherry_wood': 'cherry_log',
        'stripped_oak_wood': 'stripped_oak_log',
        'stripped_spruce_wood': 'stripped_spruce_log',
        'stripped_birch_wood': 'stripped_birch_log',
        'stripped_jungle_wood': 'stripped_jungle_log',
        'stripped_acacia_wood': 'stripped_acacia_log',
        'stripped_dark_oak_wood': 'stripped_dark_oak_log',
        'stripped_mangrove_wood': 'stripped_mangrove_log',
        'stripped_cherry_wood': 'stripped_cherry_log',
        'bamboo_block': 'bamboo_block',
        'stripped_bamboo_block': 'stripped_bamboo_block',
        
        // Glass
        'glass': 'glass',
        'tinted_glass': 'tinted_glass',
        'white_stained_glass': 'white_stained_glass',
        'orange_stained_glass': 'orange_stained_glass',
        'magenta_stained_glass': 'magenta_stained_glass',
        'light_blue_stained_glass': 'light_blue_stained_glass',
        'yellow_stained_glass': 'yellow_stained_glass',
        'lime_stained_glass': 'lime_stained_glass',
        'pink_stained_glass': 'pink_stained_glass',
        'gray_stained_glass': 'gray_stained_glass',
        'light_gray_stained_glass': 'light_gray_stained_glass',
        'cyan_stained_glass': 'cyan_stained_glass',
        'purple_stained_glass': 'purple_stained_glass',
        'blue_stained_glass': 'blue_stained_glass',
        'brown_stained_glass': 'brown_stained_glass',
        'green_stained_glass': 'green_stained_glass',
        'red_stained_glass': 'red_stained_glass',
        'black_stained_glass': 'black_stained_glass',
        
        // Wool
        'white_wool': 'white_wool',
        'orange_wool': 'orange_wool',
        'magenta_wool': 'magenta_wool',
        'light_blue_wool': 'light_blue_wool',
        'yellow_wool': 'yellow_wool',
        'lime_wool': 'lime_wool',
        'pink_wool': 'pink_wool',
        'gray_wool': 'gray_wool',
        'light_gray_wool': 'light_gray_wool',
        'cyan_wool': 'cyan_wool',
        'purple_wool': 'purple_wool',
        'blue_wool': 'blue_wool',
        'brown_wool': 'brown_wool',
        'green_wool': 'green_wool',
        'red_wool': 'red_wool',
        'black_wool': 'black_wool',
        
        // Natural blocks
        'dirt': 'dirt',
        'coarse_dirt': 'coarse_dirt',
        'podzol': 'podzol_top',
        'mycelium': 'mycelium_top',
        'grass_block': 'grass_block_side',
        'moss_block': 'moss_block',
        'mud': 'mud',
        'muddy_mangrove_roots': 'muddy_mangrove_roots_top',
        'rooted_dirt': 'rooted_dirt',
        'sand': 'sand',
        'red_sand': 'red_sand',
        'gravel': 'gravel',
        'clay': 'clay',
        'snow': 'snow',
        'snow_block': 'snow',
        'ice': 'ice',
        'packed_ice': 'packed_ice',
        'blue_ice': 'blue_ice',
        
        // Ores
        'coal_ore': 'coal_ore',
        'deepslate_coal_ore': 'deepslate_coal_ore',
        'iron_ore': 'iron_ore',
        'deepslate_iron_ore': 'deepslate_iron_ore',
        'copper_ore': 'copper_ore',
        'deepslate_copper_ore': 'deepslate_copper_ore',
        'gold_ore': 'gold_ore',
        'deepslate_gold_ore': 'deepslate_gold_ore',
        'redstone_ore': 'redstone_ore',
        'deepslate_redstone_ore': 'deepslate_redstone_ore',
        'emerald_ore': 'emerald_ore',
        'deepslate_emerald_ore': 'deepslate_emerald_ore',
        'lapis_ore': 'lapis_ore',
        'deepslate_lapis_ore': 'deepslate_lapis_ore',
        'diamond_ore': 'diamond_ore',
        'deepslate_diamond_ore': 'deepslate_diamond_ore',
        'nether_quartz_ore': 'nether_quartz_ore',
        'nether_gold_ore': 'nether_gold_ore',
        'ancient_debris': 'ancient_debris_top',
        
        // Leaves
        'oak_leaves': 'oak_leaves',
        'spruce_leaves': 'spruce_leaves',
        'birch_leaves': 'birch_leaves',
        'jungle_leaves': 'jungle_leaves',
        'acacia_leaves': 'acacia_leaves',
        'dark_oak_leaves': 'dark_oak_leaves',
        'mangrove_leaves': 'mangrove_leaves',
        'cherry_leaves': 'cherry_leaves',
        
        // Functional blocks
        'crafting_table': 'crafting_table_front',
        'furnace': 'furnace_front',
        'blast_furnace': 'blast_furnace_front',
        'smoker': 'smoker_front',
        'stonecutter': 'stonecutter_saw',
        'cartography_table': 'cartography_table_top',
        'fletching_table': 'fletching_table_top',
        'smithing_table': 'smithing_table_top',
        'loom': 'loom_front',
        'grindstone': 'grindstone_side',
        'barrel': 'barrel_top',
        'composter': 'composter_side',
        'bookshelf': 'bookshelf',
        'chiseled_bookshelf': 'chiseled_bookshelf_empty',
        'lectern': 'lectern_front',
        'enchanting_table': 'enchanting_table_top',
        'brewing_stand': 'brewing_stand',
        'cauldron': 'cauldron_inner',
        'anvil': 'anvil_top',
        'chipped_anvil': 'chipped_anvil_top',
        'damaged_anvil': 'damaged_anvil_top',
        'beehive': 'beehive_front',
        'bee_nest': 'bee_nest_front',
        'lodestone': 'lodestone_top',
        'respawn_anchor': 'respawn_anchor_side0',
        'sponge': 'sponge',
        'wet_sponge': 'wet_sponge',
        'jukebox': 'jukebox_top',
        'note_block': 'note_block',
        'tnt': 'tnt_side',
        'dispenser': 'dispenser_front',
        'dropper': 'dropper_front',
        'observer': 'observer_front',
        'piston': 'piston_side',
        'sticky_piston': 'piston_side',
        'redstone_lamp': 'redstone_lamp',
        'redstone_block': 'redstone_block',
        'target': 'target_top',
        'hay_block': 'hay_block_side',
        'dried_kelp_block': 'dried_kelp_side',
        'bone_block': 'bone_block_side',
        'nether_wart_block': 'nether_wart_block',
        'warped_wart_block': 'warped_wart_block',
        'shroomlight': 'shroomlight',
        'glowstone': 'glowstone',
        'sea_lantern': 'sea_lantern',
        'magma_block': 'magma',
        'soul_sand': 'soul_sand',
        'soul_soil': 'soul_soil',
        'netherrack': 'netherrack',
        'crimson_nylium': 'crimson_nylium',
        'warped_nylium': 'warped_nylium',
        'basalt': 'basalt_side',
        'polished_basalt': 'polished_basalt_side',
        'smooth_basalt': 'smooth_basalt',
        'calcite': 'calcite',
        'tuff': 'tuff',
        'dripstone_block': 'dripstone_block',
        'pointed_dripstone': 'pointed_dripstone_up_tip',
        'amethyst_block': 'amethyst_block',
        'budding_amethyst': 'budding_amethyst',
        'melon': 'melon_side',
        'pumpkin': 'pumpkin_side',
        'carved_pumpkin': 'carved_pumpkin',
        'jack_o_lantern': 'jack_o_lantern',
        'spawner': 'spawner',
        'obsidian': 'obsidian',
        'crying_obsidian': 'crying_obsidian',
        'bedrock': 'bedrock',
        'coal_block': 'coal_block',
        'iron_block': 'iron_block',
        'copper_block': 'copper_block',
        'gold_block': 'gold_block',
        'diamond_block': 'diamond_block',
        'emerald_block': 'emerald_block',
        'lapis_block': 'lapis_block',
        'redstone_block': 'redstone_block',
        'netherite_block': 'netherite_block',
        'raw_iron_block': 'raw_iron_block',
        'raw_copper_block': 'raw_copper_block',
        'raw_gold_block': 'raw_gold_block',
        'slime_block': 'slime_block',
        'honey_block': 'honey_block_side',
        'sponge': 'sponge',
        'wet_sponge': 'wet_sponge',
        'melon': 'melon_side',
        'sculk': 'sculk',
        'sculk_vein': 'sculk_vein',
        'sculk_catalyst': 'sculk_catalyst_side',
        'sculk_shrieker': 'sculk_shrieker_top',
        'sculk_sensor': 'sculk_sensor_top',
        'calibrated_sculk_sensor': 'calibrated_sculk_sensor_top',
        'reinforced_deepslate': 'reinforced_deepslate_side',
        'chiseled_copper': 'chiseled_copper',
        'exposed_chiseled_copper': 'exposed_chiseled_copper',
        'weathered_chiseled_copper': 'weathered_chiseled_copper',
        'oxidized_chiseled_copper': 'oxidized_chiseled_copper',
        'copper_grate': 'copper_grate',
        'exposed_copper_grate': 'exposed_copper_grate',
        'weathered_copper_grate': 'weathered_copper_grate',
        'oxidized_copper_grate': 'oxidized_copper_grate',
        'copper_bulb': 'copper_bulb',
        'exposed_copper_bulb': 'exposed_copper_bulb',
        'weathered_copper_bulb': 'weathered_copper_bulb',
        'oxidized_copper_bulb': 'oxidized_copper_bulb',
        
        // Exposed/weathered/oxidized copper variants
        'exposed_copper': 'exposed_copper',
        'weathered_copper': 'weathered_copper',
        'oxidized_copper': 'oxidized_copper',
        'cut_copper': 'cut_copper',
        'exposed_cut_copper': 'exposed_cut_copper',
        'weathered_cut_copper': 'weathered_cut_copper',
        'oxidized_cut_copper': 'oxidized_cut_copper',
        'copper_door': 'copper_door_bottom',
        'exposed_copper_door': 'exposed_copper_door_bottom',
        'weathered_copper_door': 'weathered_copper_door_bottom',
        'oxidized_copper_door': 'oxidized_copper_door_bottom',
        'copper_trapdoor': 'copper_trapdoor',
        'exposed_copper_trapdoor': 'exposed_copper_trapdoor',
        'weathered_copper_trapdoor': 'weathered_copper_trapdoor',
        'oxidized_copper_trapdoor': 'oxidized_copper_trapdoor',
        
        // Waxed copper blocks
        'waxed_copper_block': 'waxed_copper',
        'waxed_exposed_copper': 'waxed_exposed_copper',
        'waxed_weathered_copper': 'waxed_weathered_copper',
        'waxed_oxidized_copper': 'waxed_oxidized_copper',
        'waxed_cut_copper': 'waxed_cut_copper',
        'waxed_exposed_cut_copper': 'waxed_exposed_cut_copper',
        'waxed_weathered_cut_copper': 'waxed_weathered_cut_copper',
        'waxed_oxidized_cut_copper': 'waxed_oxidized_cut_copper',
        'waxed_chiseled_copper': 'waxed_chiseled_copper',
        'waxed_exposed_chiseled_copper': 'waxed_exposed_chiseled_copper',
        'waxed_weathered_chiseled_copper': 'waxed_weathered_chiseled_copper',
        'waxed_oxidized_chiseled_copper': 'waxed_oxidized_chiseled_copper',
        'waxed_copper_grate': 'waxed_copper_grate',
        'waxed_exposed_copper_grate': 'waxed_exposed_copper_grate',
        'waxed_weathered_copper_grate': 'waxed_weathered_copper_grate',
        'waxed_oxidized_copper_grate': 'waxed_oxidized_copper_grate',
        'waxed_copper_bulb': 'waxed_copper_bulb',
        'waxed_exposed_copper_bulb': 'waxed_exposed_copper_bulb',
        'waxed_weathered_copper_bulb': 'waxed_weathered_copper_bulb',
        'waxed_oxidized_copper_bulb': 'waxed_oxidized_copper_bulb',
        'waxed_copper_door': 'waxed_copper_door_bottom',
        'waxed_exposed_copper_door': 'waxed_exposed_copper_door_bottom',
        'waxed_weathered_copper_door': 'waxed_weathered_copper_door_bottom',
        'waxed_oxidized_copper_door': 'waxed_oxidized_copper_door_bottom',
        'waxed_copper_trapdoor': 'waxed_copper_trapdoor',
        'waxed_exposed_copper_trapdoor': 'waxed_exposed_copper_trapdoor',
        'waxed_weathered_copper_trapdoor': 'waxed_weathered_copper_trapdoor',
        'waxed_oxidized_copper_trapdoor': 'waxed_oxidized_copper_trapdoor',
        
        'vault': 'vault_top',
        'crafter': 'crafter_north',
        'chiseled_tuff': 'chiseled_tuff',
        'polished_tuff': 'polished_tuff',
        'tuff_bricks': 'tuff_bricks',
        'chiseled_tuff_bricks': 'chiseled_tuff_bricks',
        
        // Rails
        'rail': 'rail',
        'powered_rail': 'powered_rail',
        'detector_rail': 'detector_rail',
        'activator_rail': 'activator_rail',
        
        // Redstone components
        'repeater': 'repeater',
        'comparator': 'comparator',
        'lever': 'lever',
        'redstone_torch': 'redstone_torch',
        'tripwire_hook': 'tripwire_hook',
        'daylight_detector': 'daylight_detector_top',
        
        // Fences and walls
        'oak_fence': 'oak_planks',
        'spruce_fence': 'spruce_planks',
        'birch_fence': 'birch_planks',
        'jungle_fence': 'jungle_planks',
        'acacia_fence': 'acacia_planks',
        'dark_oak_fence': 'dark_oak_planks',
        'mangrove_fence': 'mangrove_planks',
        'cherry_fence': 'cherry_planks',
        'bamboo_fence': 'bamboo_planks',
        'crimson_fence': 'crimson_planks',
        'warped_fence': 'warped_planks',
        'nether_brick_fence': 'nether_bricks',
        
        // Fence gates
        'oak_fence_gate': 'oak_planks',
        'spruce_fence_gate': 'spruce_planks',
        'birch_fence_gate': 'birch_planks',
        'jungle_fence_gate': 'jungle_planks',
        'acacia_fence_gate': 'acacia_planks',
        'dark_oak_fence_gate': 'dark_oak_planks',
        'mangrove_fence_gate': 'mangrove_planks',
        'cherry_fence_gate': 'cherry_planks',
        'bamboo_fence_gate': 'bamboo_planks',
        'crimson_fence_gate': 'crimson_planks',
        'warped_fence_gate': 'warped_planks',
        
        // Buttons
        'oak_button': 'oak_planks',
        'spruce_button': 'spruce_planks',
        'birch_button': 'birch_planks',
        'jungle_button': 'jungle_planks',
        'acacia_button': 'acacia_planks',
        'dark_oak_button': 'dark_oak_planks',
        'mangrove_button': 'mangrove_planks',
        'cherry_button': 'cherry_planks',
        'bamboo_button': 'bamboo_planks',
        'crimson_button': 'crimson_planks',
        'warped_button': 'warped_planks',
        'stone_button': 'stone',
        'polished_blackstone_button': 'polished_blackstone',
        
        // Pressure plates
        'oak_pressure_plate': 'oak_planks',
        'spruce_pressure_plate': 'spruce_planks',
        'birch_pressure_plate': 'birch_planks',
        'jungle_pressure_plate': 'jungle_planks',
        'acacia_pressure_plate': 'acacia_planks',
        'dark_oak_pressure_plate': 'dark_oak_planks',
        'mangrove_pressure_plate': 'mangrove_planks',
        'cherry_pressure_plate': 'cherry_planks',
        'bamboo_pressure_plate': 'bamboo_planks',
        'crimson_pressure_plate': 'crimson_planks',
        'warped_pressure_plate': 'warped_planks',
        'stone_pressure_plate': 'stone',
        'polished_blackstone_pressure_plate': 'polished_blackstone',
        'light_weighted_pressure_plate': 'gold_block',
        'heavy_weighted_pressure_plate': 'iron_block',
        
        // Trapdoors (wood types)
        'oak_trapdoor': 'oak_trapdoor',
        'spruce_trapdoor': 'spruce_trapdoor',
        'birch_trapdoor': 'birch_trapdoor',
        'jungle_trapdoor': 'jungle_trapdoor',
        'acacia_trapdoor': 'acacia_trapdoor',
        'dark_oak_trapdoor': 'dark_oak_trapdoor',
        'mangrove_trapdoor': 'mangrove_trapdoor',
        'cherry_trapdoor': 'cherry_trapdoor',
        'bamboo_trapdoor': 'bamboo_trapdoor',
        'crimson_trapdoor': 'crimson_trapdoor',
        'warped_trapdoor': 'warped_trapdoor',
        'iron_trapdoor': 'iron_trapdoor',
        
        // Nether wood planks and stems
        'crimson_planks': 'crimson_planks',
        'warped_planks': 'warped_planks',
        'crimson_stem': 'crimson_stem_top',
        'warped_stem': 'warped_stem_top',
        'stripped_crimson_stem': 'stripped_crimson_stem_top',
        'stripped_warped_stem': 'stripped_warped_stem_top',
        'crimson_hyphae': 'crimson_stem',
        'warped_hyphae': 'warped_stem',
        'stripped_crimson_hyphae': 'stripped_crimson_stem',
        'stripped_warped_hyphae': 'stripped_warped_stem',
        
        // Slabs use the base block texture
        'oak_slab': 'oak_planks',
        'spruce_slab': 'spruce_planks',
        'birch_slab': 'birch_planks',
        'jungle_slab': 'jungle_planks',
        'acacia_slab': 'acacia_planks',
        'dark_oak_slab': 'dark_oak_planks',
        'mangrove_slab': 'mangrove_planks',
        'cherry_slab': 'cherry_planks',
        'bamboo_slab': 'bamboo_planks',
        'bamboo_mosaic_slab': 'bamboo_mosaic',
        'crimson_slab': 'crimson_planks',
        'warped_slab': 'warped_planks',
        'stone_slab': 'stone',
        'smooth_stone_slab': 'smooth_stone',
        'cobblestone_slab': 'cobblestone',
        'mossy_cobblestone_slab': 'mossy_cobblestone',
        'stone_brick_slab': 'stone_bricks',
        'mossy_stone_brick_slab': 'mossy_stone_bricks',
        'granite_slab': 'granite',
        'polished_granite_slab': 'polished_granite',
        'diorite_slab': 'diorite',
        'polished_diorite_slab': 'polished_diorite',
        'andesite_slab': 'andesite',
        'polished_andesite_slab': 'polished_andesite',
        'sandstone_slab': 'sandstone_top',
        'cut_sandstone_slab': 'cut_sandstone',
        'smooth_sandstone_slab': 'smooth_sandstone_top',
        'red_sandstone_slab': 'red_sandstone_top',
        'cut_red_sandstone_slab': 'cut_red_sandstone',
        'smooth_red_sandstone_slab': 'smooth_red_sandstone_top',
        'brick_slab': 'bricks',
        'prismarine_slab': 'prismarine',
        'waxed_cut_copper_slab': 'waxed_cut_copper',
        'waxed_exposed_cut_copper_slab': 'waxed_exposed_cut_copper',
        'waxed_weathered_cut_copper_slab': 'waxed_weathered_cut_copper',
        'waxed_oxidized_cut_copper_slab': 'waxed_oxidized_cut_copper',
        'prismarine_brick_slab': 'prismarine_bricks',
        'dark_prismarine_slab': 'dark_prismarine',
        'nether_brick_slab': 'nether_bricks',
        'red_nether_brick_slab': 'red_nether_bricks',
        'quartz_slab': 'quartz_block_side',
        'smooth_quartz_slab': 'quartz_block_bottom',
        'purpur_slab': 'purpur_block',
        'end_stone_brick_slab': 'end_stone_bricks',
        'blackstone_slab': 'blackstone',
        'polished_blackstone_slab': 'polished_blackstone',
        'polished_blackstone_brick_slab': 'polished_blackstone_bricks',
        'deepslate_slab': 'deepslate',
        'cobbled_deepslate_slab': 'cobbled_deepslate',
        'polished_deepslate_slab': 'polished_deepslate',
        'deepslate_brick_slab': 'deepslate_bricks',
        'deepslate_tile_slab': 'deepslate_tiles',
        'mud_brick_slab': 'mud_bricks',
        'tuff_slab': 'tuff',
        'polished_tuff_slab': 'polished_tuff',
        'tuff_brick_slab': 'tuff_bricks',
        
        // Stairs use the base block texture
        'oak_stairs': 'oak_planks',
        'spruce_stairs': 'spruce_planks',
        'birch_stairs': 'birch_planks',
        'jungle_stairs': 'jungle_planks',
        'acacia_stairs': 'acacia_planks',
        'dark_oak_stairs': 'dark_oak_planks',
        'mangrove_stairs': 'mangrove_planks',
        'cherry_stairs': 'cherry_planks',
        'bamboo_stairs': 'bamboo_planks',
        'bamboo_mosaic_stairs': 'bamboo_mosaic',
        'crimson_stairs': 'crimson_planks',
        'warped_stairs': 'warped_planks',
        'stone_stairs': 'stone',
        'cobblestone_stairs': 'cobblestone',
        'mossy_cobblestone_stairs': 'mossy_cobblestone',
        'stone_brick_stairs': 'stone_bricks',
        'mossy_stone_brick_stairs': 'mossy_stone_bricks',
        'granite_stairs': 'granite',
        'polished_granite_stairs': 'polished_granite',
        'diorite_stairs': 'diorite',
        'polished_diorite_stairs': 'polished_diorite',
        'andesite_stairs': 'andesite',
        'polished_andesite_stairs': 'polished_andesite',
        'sandstone_stairs': 'sandstone_top',
        'smooth_sandstone_stairs': 'smooth_sandstone_top',
        'red_sandstone_stairs': 'red_sandstone_top',
        'smooth_red_sandstone_stairs': 'smooth_red_sandstone_top',
        'brick_stairs': 'bricks',
        'prismarine_stairs': 'prismarine',
        'waxed_cut_copper_stairs': 'waxed_cut_copper',
        'waxed_exposed_cut_copper_stairs': 'waxed_exposed_cut_copper',
        'waxed_weathered_cut_copper_stairs': 'waxed_weathered_cut_copper',
        'waxed_oxidized_cut_copper_stairs': 'waxed_oxidized_cut_copper',
        'prismarine_brick_stairs': 'prismarine_bricks',
        'dark_prismarine_stairs': 'dark_prismarine',
        'nether_brick_stairs': 'nether_bricks',
        'red_nether_brick_stairs': 'red_nether_bricks',
        'quartz_stairs': 'quartz_block_side',
        'smooth_quartz_stairs': 'quartz_block_bottom',
        'purpur_stairs': 'purpur_block',
        'end_stone_brick_stairs': 'end_stone_bricks',
        'blackstone_stairs': 'blackstone',
        'polished_blackstone_stairs': 'polished_blackstone',
        'polished_blackstone_brick_stairs': 'polished_blackstone_bricks',
        'deepslate_stairs': 'deepslate',
        'cobbled_deepslate_stairs': 'cobbled_deepslate',
        'polished_deepslate_stairs': 'polished_deepslate',
        'deepslate_brick_stairs': 'deepslate_bricks',
        'deepslate_tile_stairs': 'deepslate_tiles',
        'mud_brick_stairs': 'mud_bricks',
        'tuff_stairs': 'tuff',
        'polished_tuff_stairs': 'polished_tuff',
        'tuff_brick_stairs': 'tuff_bricks',
        
        // Walls use base block texture
        'cobblestone_wall': 'cobblestone',
        'mossy_cobblestone_wall': 'mossy_cobblestone',
        'stone_brick_wall': 'stone_bricks',
        'mossy_stone_brick_wall': 'mossy_stone_bricks',
        'granite_wall': 'granite',
        'diorite_wall': 'diorite',
        'andesite_wall': 'andesite',
        'sandstone_wall': 'sandstone_top',
        'red_sandstone_wall': 'red_sandstone_top',
        'brick_wall': 'bricks',
        'prismarine_wall': 'prismarine',
        'nether_brick_wall': 'nether_bricks',
        'red_nether_brick_wall': 'red_nether_bricks',
        'blackstone_wall': 'blackstone',
        'polished_blackstone_wall': 'polished_blackstone',
        'polished_blackstone_brick_wall': 'polished_blackstone_bricks',
        'end_stone_brick_wall': 'end_stone_bricks',
        'deepslate_wall': 'deepslate',
        'cobbled_deepslate_wall': 'cobbled_deepslate',
        'polished_deepslate_wall': 'polished_deepslate',
        'deepslate_brick_wall': 'deepslate_bricks',
        'deepslate_tile_wall': 'deepslate_tiles',
        'mud_brick_wall': 'mud_bricks',
        'tuff_wall': 'tuff',
        'polished_tuff_wall': 'polished_tuff',
        'tuff_brick_wall': 'tuff_bricks',
        
        // Decorative blocks
        'ladder': 'ladder',
        'torch': 'torch',
        'soul_torch': 'soul_torch',
        'lantern': 'lantern',
        'soul_lantern': 'soul_lantern',
        'chain': 'chain',
        'candle': 'candle',
        'white_candle': 'white_candle',
        'orange_candle': 'orange_candle',
        'magenta_candle': 'magenta_candle',
        'light_blue_candle': 'light_blue_candle',
        'yellow_candle': 'yellow_candle',
        'lime_candle': 'lime_candle',
        'pink_candle': 'pink_candle',
        'gray_candle': 'gray_candle',
        'light_gray_candle': 'light_gray_candle',
        'cyan_candle': 'cyan_candle',
        'purple_candle': 'purple_candle',
        'blue_candle': 'blue_candle',
        'brown_candle': 'brown_candle',
        'green_candle': 'green_candle',
        'red_candle': 'red_candle',
        'black_candle': 'black_candle',
        
        // Carpets use wool texture
        'white_carpet': 'white_wool',
        'orange_carpet': 'orange_wool',
        'magenta_carpet': 'magenta_wool',
        'light_blue_carpet': 'light_blue_wool',
        'yellow_carpet': 'yellow_wool',
        'lime_carpet': 'lime_wool',
        'pink_carpet': 'pink_wool',
        'gray_carpet': 'gray_wool',
        'light_gray_carpet': 'light_gray_wool',
        'cyan_carpet': 'cyan_wool',
        'purple_carpet': 'purple_wool',
        'blue_carpet': 'blue_wool',
        'brown_carpet': 'brown_wool',
        'green_carpet': 'green_wool',
        'red_carpet': 'red_wool',
        'black_carpet': 'black_wool',
        
        // Signs use planks
        'oak_sign': 'oak_planks',
        'spruce_sign': 'spruce_planks',
        'birch_sign': 'birch_planks',
        'jungle_sign': 'jungle_planks',
        'acacia_sign': 'acacia_planks',
        'dark_oak_sign': 'dark_oak_planks',
        'mangrove_sign': 'mangrove_planks',
        'cherry_sign': 'cherry_planks',
        'bamboo_sign': 'bamboo_planks',
        'crimson_sign': 'crimson_planks',
        'warped_sign': 'warped_planks',
        'oak_hanging_sign': 'oak_planks',
        'spruce_hanging_sign': 'spruce_planks',
        'birch_hanging_sign': 'birch_planks',
        'jungle_hanging_sign': 'jungle_planks',
        'acacia_hanging_sign': 'acacia_planks',
        'dark_oak_hanging_sign': 'dark_oak_planks',
        'mangrove_hanging_sign': 'mangrove_planks',
        'cherry_hanging_sign': 'cherry_planks',
        'bamboo_hanging_sign': 'bamboo_planks',
        'crimson_hanging_sign': 'crimson_planks',
        'warped_hanging_sign': 'warped_planks',
        
        // Beds use colored wool
        'white_bed': 'white_wool',
        'orange_bed': 'orange_wool',
        'magenta_bed': 'magenta_wool',
        'light_blue_bed': 'light_blue_wool',
        'yellow_bed': 'yellow_wool',
        'lime_bed': 'lime_wool',
        'pink_bed': 'pink_wool',
        'gray_bed': 'gray_wool',
        'light_gray_bed': 'light_gray_wool',
        'cyan_bed': 'cyan_wool',
        'purple_bed': 'purple_wool',
        'blue_bed': 'blue_wool',
        'brown_bed': 'brown_wool',
        'green_bed': 'green_wool',
        'red_bed': 'red_wool',
        'black_bed': 'black_wool',
        
        // Banners use wool texture
        'white_banner': 'white_wool',
        'orange_banner': 'orange_wool',
        'magenta_banner': 'magenta_wool',
        'light_blue_banner': 'light_blue_wool',
        'yellow_banner': 'yellow_wool',
        'lime_banner': 'lime_wool',
        'pink_banner': 'pink_wool',
        'gray_banner': 'gray_wool',
        'light_gray_banner': 'light_gray_wool',
        'cyan_banner': 'cyan_wool',
        'purple_banner': 'purple_wool',
        'blue_banner': 'blue_wool',
        'brown_banner': 'brown_wool',
        'green_banner': 'green_wool',
        'red_banner': 'red_wool',
        'black_banner': 'black_wool',
        
        // Concrete powder
        'white_concrete_powder': 'white_concrete_powder',
        'orange_concrete_powder': 'orange_concrete_powder',
        'magenta_concrete_powder': 'magenta_concrete_powder',
        'light_blue_concrete_powder': 'light_blue_concrete_powder',
        'yellow_concrete_powder': 'yellow_concrete_powder',
        'lime_concrete_powder': 'lime_concrete_powder',
        'pink_concrete_powder': 'pink_concrete_powder',
        'gray_concrete_powder': 'gray_concrete_powder',
        'light_gray_concrete_powder': 'light_gray_concrete_powder',
        'cyan_concrete_powder': 'cyan_concrete_powder',
        'purple_concrete_powder': 'purple_concrete_powder',
        'blue_concrete_powder': 'blue_concrete_powder',
        'brown_concrete_powder': 'brown_concrete_powder',
        'green_concrete_powder': 'green_concrete_powder',
        'red_concrete_powder': 'red_concrete_powder',
        'black_concrete_powder': 'black_concrete_powder',
        
        // Coral blocks
        'tube_coral_block': 'tube_coral_block',
        'brain_coral_block': 'brain_coral_block',
        'bubble_coral_block': 'bubble_coral_block',
        'fire_coral_block': 'fire_coral_block',
        'horn_coral_block': 'horn_coral_block',
        'dead_tube_coral_block': 'dead_tube_coral_block',
        'dead_brain_coral_block': 'dead_brain_coral_block',
        'dead_bubble_coral_block': 'dead_bubble_coral_block',
        'dead_fire_coral_block': 'dead_fire_coral_block',
        'dead_horn_coral_block': 'dead_horn_coral_block',
        
        // Coral items (use block textures)
        'tube_coral': 'tube_coral',
        'brain_coral': 'brain_coral',
        'bubble_coral': 'bubble_coral',
        'fire_coral': 'fire_coral',
        'horn_coral': 'horn_coral',
        'dead_tube_coral': 'dead_tube_coral',
        'dead_brain_coral': 'dead_brain_coral',
        'dead_bubble_coral': 'dead_bubble_coral',
        'dead_fire_coral': 'dead_fire_coral',
        'dead_horn_coral': 'dead_horn_coral',
        
        // Shulker boxes (use block textures)
        'shulker_box': 'shulker_box',
        'white_shulker_box': 'white_shulker_box',
        'orange_shulker_box': 'orange_shulker_box',
        'magenta_shulker_box': 'magenta_shulker_box',
        'light_blue_shulker_box': 'light_blue_shulker_box',
        'yellow_shulker_box': 'yellow_shulker_box',
        'lime_shulker_box': 'lime_shulker_box',
        'pink_shulker_box': 'pink_shulker_box',
        'gray_shulker_box': 'gray_shulker_box',
        'light_gray_shulker_box': 'light_gray_shulker_box',
        'cyan_shulker_box': 'cyan_shulker_box',
        'purple_shulker_box': 'purple_shulker_box',
        'blue_shulker_box': 'blue_shulker_box',
        'brown_shulker_box': 'brown_shulker_box',
        'green_shulker_box': 'green_shulker_box',
        'red_shulker_box': 'red_shulker_box',
        'black_shulker_box': 'black_shulker_box',
        
        // Coral fans (use block textures)
        'tube_coral_fan': 'tube_coral_fan',
        'brain_coral_fan': 'brain_coral_fan',
        'bubble_coral_fan': 'bubble_coral_fan',
        'fire_coral_fan': 'fire_coral_fan',
        'horn_coral_fan': 'horn_coral_fan',
        'dead_tube_coral_fan': 'dead_tube_coral_fan',
        'dead_brain_coral_fan': 'dead_brain_coral_fan',
        'dead_bubble_coral_fan': 'dead_bubble_coral_fan',
        'dead_fire_coral_fan': 'dead_fire_coral_fan',
        'dead_horn_coral_fan': 'dead_horn_coral_fan',
        
        // Sponge
        'sponge': 'sponge',
        'wet_sponge': 'wet_sponge',
        
        // Saplings (use block textures)
        'oak_sapling': 'oak_sapling',
        'spruce_sapling': 'spruce_sapling',
        'birch_sapling': 'birch_sapling',
        'jungle_sapling': 'jungle_sapling',
        'acacia_sapling': 'acacia_sapling',
        'dark_oak_sapling': 'dark_oak_sapling',
        'mangrove_propagule': 'mangrove_propagule',
        'cherry_sapling': 'cherry_sapling',
        
        // Cactus
        'cactus': 'cactus_side',
        
        // Mushrooms (use block textures)
        'brown_mushroom': 'brown_mushroom',
        'red_mushroom': 'red_mushroom',
        'crimson_fungus': 'crimson_fungus',
        'warped_fungus': 'warped_fungus',
        'mushroom_stem': 'mushroom_stem',
        'brown_mushroom_block': 'brown_mushroom_block',
        'red_mushroom_block': 'red_mushroom_block',
        
        // Moss and azalea
        'moss_carpet': 'moss_carpet',
        'azalea': 'azalea_top',
        'flowering_azalea': 'flowering_azalea_top',
        'azalea_leaves': 'azalea_leaves',
        'flowering_azalea_leaves': 'flowering_azalea_leaves',
        
        // Chorus plants
        'chorus_plant': 'chorus_plant',
        'chorus_flower': 'chorus_flower',
        
        // Farmland
        'farmland': 'farmland',
        
        // Torchflower
        'torchflower': 'torchflower',
        
        // End items
        'end_rod': 'end_rod',
        
        // Trial spawner
        'trial_spawner': 'trial_spawner_top',
        
        // Heads and skulls (use block textures)
        'player_head': 'player_head',
        'skeleton_skull': 'skeleton_skull',
        'wither_skeleton_skull': 'wither_skeleton_skull',
        'zombie_head': 'zombie_head',
        'creeper_head': 'creeper_head',
        'piglin_head': 'piglin_head',
        'dragon_head': 'dragon_head',
        
        // Shield
        'shield': 'shield',
        
        // Nether plants (use block textures)
        'crimson_roots': 'crimson_roots',
        'warped_roots': 'warped_roots',
        'nether_sprouts': 'nether_sprouts',
        'weeping_vines': 'weeping_vines',
        'twisting_vines': 'twisting_vines',
        
        // Misc functional blocks
        'hopper': 'hopper_outside',
        'chest': 'oak_planks',
        'trapped_chest': 'oak_planks',
        'ender_chest': 'obsidian',
        'dragon_egg': 'dragon_egg',
        'beacon': 'beacon',
        'conduit': 'conduit',
        'end_portal_frame': 'end_portal_frame_top',
        'end_gateway': 'end_gateway'
    };
    
    // Check if item uses block texture
    if (blockTextureItems[cleanName]) {
        return `${MINECRAFT_ICON_CDN_BLOCK}${blockTextureItems[cleanName]}.png`;
    }
    
    // Items with special texture name mappings (not block textures)
    const itemTextureMap = {
        // Doors, trapdoors, buttons use different naming
        'oak_door': 'oak_door',
        'spruce_door': 'spruce_door',
        'birch_door': 'birch_door',
        'jungle_door': 'jungle_door',
        'acacia_door': 'acacia_door',
        'dark_oak_door': 'dark_oak_door',
        'mangrove_door': 'mangrove_door',
        'cherry_door': 'cherry_door',
        'bamboo_door': 'bamboo_door',
        'crimson_door': 'crimson_door',
        'warped_door': 'warped_door',
        'iron_door': 'iron_door',
        
        // Chorus
        'chorus_fruit': 'chorus_fruit',
        'popped_chorus_fruit': 'popped_chorus_fruit',
        
        // Crops and seeds
        'wheat_seeds': 'wheat_seeds',
        'beetroot_seeds': 'beetroot_seeds',
        'melon_seeds': 'melon_seeds',
        'pumpkin_seeds': 'pumpkin_seeds',
        'torchflower_seeds': 'torchflower_seeds',
        'pitcher_pod': 'pitcher_pod',
        
        // Coral and plants
        'seagrass': 'seagrass',
        'sea_pickle': 'sea_pickle',
        'kelp': 'kelp',
        'dried_kelp': 'dried_kelp',
        'bamboo': 'bamboo',
        'sugar_cane': 'sugar_cane',
        'vine': 'vine',
        'glow_berries': 'glow_berries',
        'sweet_berries': 'sweet_berries',
        
        // Items that have item textures
        'bell': 'bell',
        'campfire': 'campfire',
        'soul_campfire': 'soul_campfire',
        'glow_lichen': 'glow_lichen',
        'cobweb': 'cobweb',
        'iron_bars': 'iron_bars',
        'glass_pane': 'glass_pane',
        'nether_wart': 'nether_wart',
        
        // Flowers (all have item textures)
        'dandelion': 'dandelion',
        'poppy': 'poppy',
        'blue_orchid': 'blue_orchid',
        'allium': 'allium',
        'azure_bluet': 'azure_bluet',
        'red_tulip': 'red_tulip',
        'orange_tulip': 'orange_tulip',
        'white_tulip': 'white_tulip',
        'pink_tulip': 'pink_tulip',
        'oxeye_daisy': 'oxeye_daisy',
        'cornflower': 'cornflower',
        'lily_of_the_valley': 'lily_of_the_valley',
        'wither_rose': 'wither_rose',
        'pitcher_plant': 'pitcher_plant',
        'sunflower': 'sunflower',
        'lilac': 'lilac',
        'rose_bush': 'rose_bush',
        'peony': 'peony',
        
        // Stained glass panes (all have item textures)
        'white_stained_glass_pane': 'white_stained_glass_pane',
        'orange_stained_glass_pane': 'orange_stained_glass_pane',
        'magenta_stained_glass_pane': 'magenta_stained_glass_pane',
        'light_blue_stained_glass_pane': 'light_blue_stained_glass_pane',
        'yellow_stained_glass_pane': 'yellow_stained_glass_pane',
        'lime_stained_glass_pane': 'lime_stained_glass_pane',
        'pink_stained_glass_pane': 'pink_stained_glass_pane',
        'gray_stained_glass_pane': 'gray_stained_glass_pane',
        'light_gray_stained_glass_pane': 'light_gray_stained_glass_pane',
        'cyan_stained_glass_pane': 'cyan_stained_glass_pane',
        'purple_stained_glass_pane': 'purple_stained_glass_pane',
        'blue_stained_glass_pane': 'blue_stained_glass_pane',
        'brown_stained_glass_pane': 'brown_stained_glass_pane',
        'green_stained_glass_pane': 'green_stained_glass_pane',
        'red_stained_glass_pane': 'red_stained_glass_pane',
        'black_stained_glass_pane': 'black_stained_glass_pane',
        
        // Buckets and liquids
        'bucket': 'bucket',
        'water_bucket': 'water_bucket',
        'lava_bucket': 'lava_bucket',
        'milk_bucket': 'milk_bucket',
        'powder_snow_bucket': 'powder_snow_bucket',
        
        // Minecarts
        'minecart': 'minecart',
        'chest_minecart': 'chest_minecart',
        'furnace_minecart': 'furnace_minecart',
        'tnt_minecart': 'tnt_minecart',
        'hopper_minecart': 'hopper_minecart',
        
        // Boats
        'oak_boat': 'oak_boat',
        'spruce_boat': 'spruce_boat',
        'birch_boat': 'birch_boat',
        'jungle_boat': 'jungle_boat',
        'acacia_boat': 'acacia_boat',
        'dark_oak_boat': 'dark_oak_boat',
        'mangrove_boat': 'mangrove_boat',
        'cherry_boat': 'cherry_boat',
        'bamboo_raft': 'bamboo_raft',
        'oak_chest_boat': 'oak_chest_boat',
        'spruce_chest_boat': 'spruce_chest_boat',
        'birch_chest_boat': 'birch_chest_boat',
        'jungle_chest_boat': 'jungle_chest_boat',
        'acacia_chest_boat': 'acacia_chest_boat',
        'dark_oak_chest_boat': 'dark_oak_chest_boat',
        'mangrove_chest_boat': 'mangrove_chest_boat',
        'cherry_chest_boat': 'cherry_chest_boat',
        'bamboo_chest_raft': 'bamboo_chest_raft',
        
        // Special items
        'ender_eye': 'ender_eye',
        'ender_pearl': 'ender_pearl',
        'experience_bottle': 'experience_bottle',
        'glass_bottle': 'glass_bottle',
        'dragon_breath': 'dragon_breath',
        'fire_charge': 'fire_charge',
        'firework_rocket': 'firework_rocket',
        'firework_star': 'firework_star',
        'nether_star': 'nether_star',
        'totem_of_undying': 'totem_of_undying',
        'elytra': 'elytra',
        'trident': 'trident',
        'heart_of_the_sea': 'heart_of_the_sea',
        'nautilus_shell': 'nautilus_shell',
        
        // Animated items - use first frame (_00)
        'compass': 'compass_16',
        'recovery_compass': 'recovery_compass_16',
        'clock': 'clock_00',
        
        // Maps and related
        'map': 'map',
        'filled_map': 'filled_map',
        
        // 1.21 Trial Chambers Update items
        'trial_key': 'trial_key',
        'suspicious_sand': 'suspicious_sand',
        'suspicious_gravel': 'suspicious_gravel',
        'ominous_trial_key': 'ominous_trial_key',
        'breeze_rod': 'breeze_rod',
        'wind_charge': 'wind_charge',
        'mace': 'mace',
        'heavy_core': 'heavy_core',
        'wolf_armor': 'wolf_armor',
        
        // Copper doors and trapdoors
        'copper_door': 'copper_door',
        'exposed_copper_door': 'exposed_copper_door',
        'weathered_copper_door': 'weathered_copper_door',
        'oxidized_copper_door': 'oxidized_copper_door',
        'waxed_copper_door': 'waxed_copper_door',
        'waxed_exposed_copper_door': 'waxed_exposed_copper_door',
        'waxed_weathered_copper_door': 'waxed_weathered_copper_door',
        'waxed_oxidized_copper_door': 'waxed_oxidized_copper_door',
        'copper_trapdoor': 'copper_trapdoor',
        'exposed_copper_trapdoor': 'exposed_copper_trapdoor',
        'weathered_copper_trapdoor': 'weathered_copper_trapdoor',
        'oxidized_copper_trapdoor': 'oxidized_copper_trapdoor',
        'waxed_copper_trapdoor': 'waxed_copper_trapdoor',
        'waxed_exposed_copper_trapdoor': 'waxed_exposed_copper_trapdoor',
        'waxed_weathered_copper_trapdoor': 'waxed_weathered_copper_trapdoor',
        'waxed_oxidized_copper_trapdoor': 'waxed_oxidized_copper_trapdoor',
        
        // Other special items
        'goat_horn': 'goat_horn',
        'echo_shard': 'echo_shard',
        'disc_fragment_5': 'disc_fragment_5',
        'armadillo_scute': 'armadillo_scute',
        'sniffer_egg': 'sniffer_egg',
        'pink_petals': 'pink_petals',
        'spore_blossom': 'spore_blossom',
        'hanging_roots': 'hanging_roots',
        
        // Command and structure blocks
        'command_block': 'command_block',
        'chain_command_block': 'chain_command_block',
        'repeating_command_block': 'repeating_command_block',
        'command_block_minecart': 'command_block_minecart',
        'structure_block': 'structure_block',
        'structure_void': 'structure_void',
        'jigsaw': 'jigsaw',
        'barrier': 'barrier',
        'light': 'light',
        'debug_stick': 'debug_stick',
        
        // Books
        'book': 'book',
        'enchanted_book': 'enchanted_book',
        'knowledge_book': 'knowledge_book',
        'writable_book': 'writable_book',
        'written_book': 'written_book',
        
        // End items
        'end_portal_frame': 'end_portal_frame',
        'end_crystal': 'end_crystal',
        'shulker_shell': 'shulker_shell',
        
        // Horse armor
        'leather_horse_armor': 'leather_horse_armor',
        'iron_horse_armor': 'iron_horse_armor',
        'golden_horse_armor': 'golden_horse_armor',
        'diamond_horse_armor': 'diamond_horse_armor',
        
        // Saddle and leads
        'saddle': 'saddle',
        'lead': 'lead',
        'name_tag': 'name_tag',
        'bundle': 'bundle',
        
        // Mob buckets
        'cod_bucket': 'cod_bucket',
        'salmon_bucket': 'salmon_bucket',
        'pufferfish_bucket': 'pufferfish_bucket',
        'tropical_fish_bucket': 'tropical_fish_bucket',
        'tadpole_bucket': 'tadpole_bucket',
        'axolotl_bucket': 'axolotl_bucket',
        
        // Carrot/fungus on a stick
        'carrot_on_a_stick': 'carrot_on_a_stick',
        'warped_fungus_on_a_stick': 'warped_fungus_on_a_stick',
        
        // Combat items
        'totem_of_undying': 'totem_of_undying',
        'turtle_helmet': 'turtle_helmet',
        
        // Misc tools
        'brush': 'brush',
        'spyglass': 'spyglass',
        'shears': 'shears',
        'flint_and_steel': 'flint_and_steel',
        'fishing_rod': 'fishing_rod',
        'bow': 'bow',
        'crossbow': 'crossbow_standby',
        
        // All tools - wooden
        'wooden_sword': 'wooden_sword',
        'wooden_axe': 'wooden_axe',
        'wooden_pickaxe': 'wooden_pickaxe',
        'wooden_shovel': 'wooden_shovel',
        'wooden_hoe': 'wooden_hoe',
        
        // All tools - stone
        'stone_sword': 'stone_sword',
        'stone_axe': 'stone_axe',
        'stone_pickaxe': 'stone_pickaxe',
        'stone_shovel': 'stone_shovel',
        'stone_hoe': 'stone_hoe',
        
        // All tools - iron
        'iron_sword': 'iron_sword',
        'iron_axe': 'iron_axe',
        'iron_pickaxe': 'iron_pickaxe',
        'iron_shovel': 'iron_shovel',
        'iron_hoe': 'iron_hoe',
        
        // All tools - golden
        'golden_sword': 'golden_sword',
        'golden_axe': 'golden_axe',
        'golden_pickaxe': 'golden_pickaxe',
        'golden_shovel': 'golden_shovel',
        'golden_hoe': 'golden_hoe',
        
        // All tools - diamond
        'diamond_sword': 'diamond_sword',
        'diamond_axe': 'diamond_axe',
        'diamond_pickaxe': 'diamond_pickaxe',
        'diamond_shovel': 'diamond_shovel',
        'diamond_hoe': 'diamond_hoe',
        
        // All tools - netherite
        'netherite_sword': 'netherite_sword',
        'netherite_axe': 'netherite_axe',
        'netherite_pickaxe': 'netherite_pickaxe',
        'netherite_shovel': 'netherite_shovel',
        'netherite_hoe': 'netherite_hoe',
        
        // All armor - leather
        'leather_helmet': 'leather_helmet',
        'leather_chestplate': 'leather_chestplate',
        'leather_leggings': 'leather_leggings',
        'leather_boots': 'leather_boots',
        
        // All armor - chainmail
        'chainmail_helmet': 'chainmail_helmet',
        'chainmail_chestplate': 'chainmail_chestplate',
        'chainmail_leggings': 'chainmail_leggings',
        'chainmail_boots': 'chainmail_boots',
        
        // All armor - iron
        'iron_helmet': 'iron_helmet',
        'iron_chestplate': 'iron_chestplate',
        'iron_leggings': 'iron_leggings',
        'iron_boots': 'iron_boots',
        
        // All armor - golden
        'golden_helmet': 'golden_helmet',
        'golden_chestplate': 'golden_chestplate',
        'golden_leggings': 'golden_leggings',
        'golden_boots': 'golden_boots',
        
        // All armor - diamond
        'diamond_helmet': 'diamond_helmet',
        'diamond_chestplate': 'diamond_chestplate',
        'diamond_leggings': 'diamond_leggings',
        'diamond_boots': 'diamond_boots',
        
        // All armor - netherite
        'netherite_helmet': 'netherite_helmet',
        'netherite_chestplate': 'netherite_chestplate',
        'netherite_leggings': 'netherite_leggings',
        'netherite_boots': 'netherite_boots',
        
        // Ores and minerals (items, not blocks)
        'coal': 'coal',
        'charcoal': 'charcoal',
        'raw_iron': 'raw_iron',
        'raw_copper': 'raw_copper',
        'raw_gold': 'raw_gold',
        'iron_ingot': 'iron_ingot',
        'copper_ingot': 'copper_ingot',
        'gold_ingot': 'gold_ingot',
        'netherite_ingot': 'netherite_ingot',
        'iron_nugget': 'iron_nugget',
        'gold_nugget': 'gold_nugget',
        'diamond': 'diamond',
        'emerald': 'emerald',
        'lapis_lazuli': 'lapis_lazuli',
        'quartz': 'quartz',
        'amethyst_shard': 'amethyst_shard',
        'redstone': 'redstone',
        'glowstone_dust': 'glowstone_dust',
        
        // Nether materials
        'netherite_scrap': 'netherite_scrap',
        'blaze_rod': 'blaze_rod',
        'blaze_powder': 'blaze_powder',
        'ghast_tear': 'ghast_tear',
        'magma_cream': 'magma_cream',
        
        // Ocean materials
        'prismarine_shard': 'prismarine_shard',
        'prismarine_crystals': 'prismarine_crystals',
        
        // Food items
        'apple': 'apple',
        'golden_apple': 'golden_apple',
        'enchanted_golden_apple': 'enchanted_golden_apple',
        'melon_slice': 'melon_slice',
        'glistering_melon_slice': 'glistering_melon_slice',
        'carrot': 'carrot',
        'golden_carrot': 'golden_carrot',
        'potato': 'potato',
        'baked_potato': 'baked_potato',
        'poisonous_potato': 'poisonous_potato',
        'beetroot': 'beetroot',
        'beetroot_soup': 'beetroot_soup',
        'bread': 'bread',
        'cookie': 'cookie',
        'cake': 'cake',
        'pumpkin_pie': 'pumpkin_pie',
        'beef': 'beef',
        'cooked_beef': 'cooked_beef',
        'porkchop': 'porkchop',
        'cooked_porkchop': 'cooked_porkchop',
        'mutton': 'mutton',
        'cooked_mutton': 'cooked_mutton',
        'chicken': 'chicken',
        'cooked_chicken': 'cooked_chicken',
        'rabbit': 'rabbit',
        'cooked_rabbit': 'cooked_rabbit',
        'rabbit_stew': 'rabbit_stew',
        'cod': 'cod',
        'cooked_cod': 'cooked_cod',
        'salmon': 'salmon',
        'cooked_salmon': 'cooked_salmon',
        'tropical_fish': 'tropical_fish',
        'pufferfish': 'pufferfish',
        'mushroom_stew': 'mushroom_stew',
        'honey_bottle': 'honey_bottle',
        'sugar': 'sugar',
        
        // Farming items
        'wheat': 'wheat',
        
        // Combat items
        'arrow': 'arrow',
        'spectral_arrow': 'spectral_arrow',
        'snowball': 'snowball',
        'egg': 'egg',
        
        // Decoration items
        'painting': 'painting',
        'item_frame': 'item_frame',
        'glow_item_frame': 'glow_item_frame',
        'armor_stand': 'armor_stand',
        'flower_pot': 'flower_pot',
        'decorated_pot': 'decorated_pot',
        'scaffolding': 'scaffolding',
        'lily_pad': 'lily_pad',
        'dead_bush': 'dead_bush',
        'fern': 'fern',
        'large_fern': 'large_fern',
        'grass': 'grass',
        'tall_grass': 'tall_grass',
        'lightning_rod': 'lightning_rod',
        
        // Mob drops
        'leather': 'leather',
        'rabbit_hide': 'rabbit_hide',
        'feather': 'feather',
        'bone': 'bone',
        'string': 'string',
        'slime_ball': 'slime_ball',
        'rotten_flesh': 'rotten_flesh',
        'spider_eye': 'spider_eye',
        'phantom_membrane': 'phantom_membrane',
        'scute': 'scute',
        'ink_sac': 'ink_sac',
        'glow_ink_sac': 'glow_ink_sac',
        
        // All 16 dyes
        'white_dye': 'white_dye',
        'orange_dye': 'orange_dye',
        'magenta_dye': 'magenta_dye',
        'light_blue_dye': 'light_blue_dye',
        'yellow_dye': 'yellow_dye',
        'lime_dye': 'lime_dye',
        'pink_dye': 'pink_dye',
        'gray_dye': 'gray_dye',
        'light_gray_dye': 'light_gray_dye',
        'cyan_dye': 'cyan_dye',
        'purple_dye': 'purple_dye',
        'blue_dye': 'blue_dye',
        'brown_dye': 'brown_dye',
        'green_dye': 'green_dye',
        'red_dye': 'red_dye',
        'black_dye': 'black_dye',
        'bone_meal': 'bone_meal',
        'cocoa_beans': 'cocoa_beans',
        
        // Brewing ingredients
        'fermented_spider_eye': 'fermented_spider_eye',
        'gunpowder': 'gunpowder',
        
        // Miscellaneous
        'stick': 'stick',
        'bowl': 'bowl',
        'paper': 'paper',
        'brick': 'brick',
        'nether_brick': 'nether_brick',
        'clay_ball': 'clay_ball',
        'flint': 'flint',
        'rabbit_foot': 'rabbit_foot',
        'honeycomb': 'honeycomb',
        'banner_pattern': 'banner_pattern'
    };
    
    // Check special item texture mappings first
    if (itemTextureMap[cleanName]) {
        return `${MINECRAFT_ICON_CDN_ITEM}${itemTextureMap[cleanName]}.png`;
    }
    
    // Special item patterns that all follow the same naming convention
    // Spawn eggs - in 1.21+ they use a generic template with overlay coloring
    // Try individual egg first, fallback to generic spawn_egg.png
    if (cleanName.endsWith('_spawn_egg')) {
        // Use generic spawn egg since 1.21+ doesn't have individual textures
        return `${MINECRAFT_ICON_CDN_ITEM}spawn_egg.png`;
    }
    
    // Music discs
    if (cleanName.startsWith('music_disc_')) {
        return `${MINECRAFT_ICON_CDN_ITEM}${cleanName}.png`;
    }
    
    // Pottery sherds
    if (cleanName.endsWith('_pottery_sherd')) {
        return `${MINECRAFT_ICON_CDN_ITEM}${cleanName}.png`;
    }
    
    // Banner patterns
    if (cleanName.endsWith('_banner_pattern')) {
        return `${MINECRAFT_ICON_CDN_ITEM}${cleanName}.png`;
    }
    
    // Smithing templates
    if (cleanName.endsWith('_smithing_template')) {
        return `${MINECRAFT_ICON_CDN_ITEM}${cleanName}.png`;
    }
    
    // Potions - use the generic potion bottle
    if (cleanName.includes('potion') || cleanName.includes('splash') || cleanName.includes('lingering')) {
        return `${MINECRAFT_ICON_CDN_ITEM}potion.png`;
    }
    
    // Tipped arrows use the generic tipped arrow texture
    if (cleanName.includes('tipped_arrow')) {
        return `${MINECRAFT_ICON_CDN_ITEM}tipped_arrow.png`;
    }
    
    // Suspicious stew uses mushroom stew texture
    if (cleanName === 'suspicious_stew') {
        return `${MINECRAFT_ICON_CDN_ITEM}mushroom_stew.png`;
    }
    
    // Default to item texture
    return `${MINECRAFT_ICON_CDN_ITEM}${cleanName}.png`;
}

/**
 * Create an image element for a Minecraft item icon
 * @param {string} itemName - The Minecraft item ID (or MythicMobs item internal name)
 * @param {object} options - Options for the icon
 * @returns {HTMLElement} Image element, wrapper with badge, or fallback span
 */
function createMinecraftIcon(itemName, options = {}) {
    const {
        size = 16,
        className = 'mc-item-icon',
        showFallback = true
    } = options;
    
    // Check if this is a MythicMobs item first
    if (window.editor?.state?.items) {
        const mythicItem = window.editor.state.items.find(
            item => item.internalName === itemName && !item._isFileContainer
        );
        
        if (mythicItem) {
            // Use the item's material for the icon
            const material = mythicItem.Id;
            if (material) {
                // Recursively call with the material to get the Minecraft icon
                const materialIcon = createMinecraftIcon(material, { size, className, showFallback });
                
                // Wrap in a container with a MythicMobs badge
                const wrapper = document.createElement('div');
                wrapper.style.position = 'relative';
                wrapper.style.display = 'inline-block';
                wrapper.style.width = size + 'px';
                wrapper.style.height = size + 'px';
                wrapper.appendChild(materialIcon);
                
                // Add small 🔮 badge
                const badge = document.createElement('span');
                badge.textContent = '🔮';
                badge.style.position = 'absolute';
                badge.style.bottom = '-2px';
                badge.style.right = '-2px';
                badge.style.fontSize = Math.max(8, size * 0.4) + 'px';
                badge.style.lineHeight = '1';
                badge.style.filter = 'drop-shadow(0 0 1px rgba(0,0,0,0.5))';
                badge.title = 'MythicMobs Item';
                wrapper.appendChild(badge);
                
                return wrapper;
            }
        }
    }
    
    // Standard Minecraft item icon
    const img = document.createElement('img');
    img.className = className;
    img.width = size;
    img.height = size;
    img.src = getMinecraftItemIcon(itemName);
    img.alt = itemName;
    img.title = itemName;
    
    // Fallback to colored square if image fails to load
    if (showFallback) {
        img.onerror = function() {
            const span = document.createElement('span');
            span.className = 'mc-item-icon-fallback';
            span.style.width = size + 'px';
            span.style.height = size + 'px';
            span.textContent = itemName.charAt(0).toUpperCase();
            this.replaceWith(span);
        };
    }
    
    return img;
}

/**
 * Preload icons for better performance
 * @param {Array} itemNames - Array of item names to preload
 */
function preloadMinecraftIcons(itemNames) {
    itemNames.forEach(itemName => {
        const img = new Image();
        img.src = getMinecraftItemIcon(itemName);
    });
}

// Expose globally
window.getMinecraftItemIcon = getMinecraftItemIcon;
window.createMinecraftIcon = createMinecraftIcon;
window.preloadMinecraftIcons = preloadMinecraftIcons;
