/**
 * Minecraft Item Categories
 * Organizes all Minecraft items into logical categories for better UX
 * Supports icons, colors, and multi-category items
 */

const MINECRAFT_ITEM_CATEGORIES = {
    'Building Blocks': {
        icon: '🧱',
        iconItem: 'bricks',
        color: '#8B4513',
        items: [
            'stone', 'granite', 'polished_granite', 'diorite', 'polished_diorite', 'andesite', 'polished_andesite',
            'deepslate', 'cobbled_deepslate', 'polished_deepslate', 'deepslate_bricks', 'deepslate_tiles',
            'cobblestone', 'mossy_cobblestone', 'stone_bricks', 'mossy_stone_bricks', 'cracked_stone_bricks', 'chiseled_stone_bricks',
            'bricks', 'mud_bricks', 'packed_mud',
            'sandstone', 'chiseled_sandstone', 'cut_sandstone', 'smooth_sandstone',
            'red_sandstone', 'chiseled_red_sandstone', 'cut_red_sandstone', 'smooth_red_sandstone',
            'prismarine', 'prismarine_bricks', 'dark_prismarine',
            'white_terracotta', 'orange_terracotta', 'magenta_terracotta', 'light_blue_terracotta', 'yellow_terracotta', 'lime_terracotta', 'pink_terracotta', 'gray_terracotta', 'light_gray_terracotta', 'cyan_terracotta', 'purple_terracotta', 'blue_terracotta', 'brown_terracotta', 'green_terracotta', 'red_terracotta', 'black_terracotta', 'terracotta',
            'white_concrete', 'orange_concrete', 'magenta_concrete', 'light_blue_concrete', 'yellow_concrete', 'lime_concrete', 'pink_concrete', 'gray_concrete', 'light_gray_concrete', 'cyan_concrete', 'purple_concrete', 'blue_concrete', 'brown_concrete', 'green_concrete', 'red_concrete', 'black_concrete',
            'white_concrete_powder', 'orange_concrete_powder', 'magenta_concrete_powder', 'light_blue_concrete_powder', 'yellow_concrete_powder', 'lime_concrete_powder', 'pink_concrete_powder', 'gray_concrete_powder', 'light_gray_concrete_powder', 'cyan_concrete_powder', 'purple_concrete_powder', 'blue_concrete_powder', 'brown_concrete_powder', 'green_concrete_powder', 'red_concrete_powder', 'black_concrete_powder',
            'white_glazed_terracotta', 'orange_glazed_terracotta', 'magenta_glazed_terracotta', 'light_blue_glazed_terracotta', 'yellow_glazed_terracotta', 'lime_glazed_terracotta', 'pink_glazed_terracotta', 'gray_glazed_terracotta', 'light_gray_glazed_terracotta', 'cyan_glazed_terracotta', 'purple_glazed_terracotta', 'blue_glazed_terracotta', 'brown_glazed_terracotta', 'green_glazed_terracotta', 'red_glazed_terracotta', 'black_glazed_terracotta',
            'tuff', 'polished_tuff', 'tuff_bricks', 'chiseled_tuff', 'chiseled_tuff_bricks',
            'glass', 'tinted_glass',
            'white_stained_glass', 'orange_stained_glass', 'magenta_stained_glass', 'light_blue_stained_glass', 'yellow_stained_glass', 'lime_stained_glass', 'pink_stained_glass', 'gray_stained_glass', 'light_gray_stained_glass', 'cyan_stained_glass', 'purple_stained_glass', 'blue_stained_glass', 'brown_stained_glass', 'green_stained_glass', 'red_stained_glass', 'black_stained_glass',
            'white_wool', 'orange_wool', 'magenta_wool', 'light_blue_wool', 'yellow_wool', 'lime_wool', 'pink_wool', 'gray_wool', 'light_gray_wool', 'cyan_wool', 'purple_wool', 'blue_wool', 'brown_wool', 'green_wool', 'red_wool', 'black_wool',
            'quartz_block', 'chiseled_quartz_block', 'quartz_bricks', 'quartz_pillar', 'smooth_quartz'
        ]
    },
    'Wood & Plants': {
        icon: '🌳',
        iconItem: 'oak_log',
        color: '#8B7355',
        items: [
            'oak_planks', 'spruce_planks', 'birch_planks', 'jungle_planks', 'acacia_planks', 'dark_oak_planks', 'mangrove_planks', 'cherry_planks', 'bamboo_planks', 'bamboo_mosaic', 'crimson_planks', 'warped_planks',
            'oak_log', 'spruce_log', 'birch_log', 'jungle_log', 'acacia_log', 'dark_oak_log', 'mangrove_log', 'cherry_log',
            'stripped_oak_log', 'stripped_spruce_log', 'stripped_birch_log', 'stripped_jungle_log', 'stripped_acacia_log', 'stripped_dark_oak_log', 'stripped_mangrove_log', 'stripped_cherry_log',
            'oak_wood', 'spruce_wood', 'birch_wood', 'jungle_wood', 'acacia_wood', 'dark_oak_wood', 'mangrove_wood', 'cherry_wood',
            'stripped_oak_wood', 'stripped_spruce_wood', 'stripped_birch_wood', 'stripped_jungle_wood', 'stripped_acacia_wood', 'stripped_dark_oak_wood', 'stripped_mangrove_wood', 'stripped_cherry_wood',
            'bamboo_block', 'stripped_bamboo_block',
            'crimson_stem', 'warped_stem', 'stripped_crimson_stem', 'stripped_warped_stem',
            'crimson_hyphae', 'warped_hyphae', 'stripped_crimson_hyphae', 'stripped_warped_hyphae',
            'oak_leaves', 'spruce_leaves', 'birch_leaves', 'jungle_leaves', 'acacia_leaves', 'dark_oak_leaves', 'mangrove_leaves', 'cherry_leaves', 'azalea_leaves', 'flowering_azalea_leaves',
            'oak_sapling', 'spruce_sapling', 'birch_sapling', 'jungle_sapling', 'acacia_sapling', 'dark_oak_sapling', 'mangrove_propagule', 'cherry_sapling',
            'azalea', 'flowering_azalea'
        ]
    },
    'Natural Terrain': {
        icon: '🏔️',
        iconItem: 'grass_block',
        color: '#7CB342',
        items: [
            'dirt', 'coarse_dirt', 'podzol', 'mycelium', 'grass_block', 'moss_block', 'moss_carpet',
            'mud', 'muddy_mangrove_roots', 'rooted_dirt',
            'sand', 'red_sand', 'gravel', 'clay', 'snow', 'snow_block', 'ice', 'packed_ice', 'blue_ice',
            'calcite', 'dripstone_block', 'pointed_dripstone',
            'bedrock'
        ]
    },
    'Ores & Minerals': {
        icon: '💎',
        iconItem: 'diamond',
        color: '#00BCD4',
        items: [
            'coal_ore', 'deepslate_coal_ore', 'iron_ore', 'deepslate_iron_ore', 'copper_ore', 'deepslate_copper_ore',
            'gold_ore', 'deepslate_gold_ore', 'redstone_ore', 'deepslate_redstone_ore',
            'emerald_ore', 'deepslate_emerald_ore', 'lapis_ore', 'deepslate_lapis_ore',
            'diamond_ore', 'deepslate_diamond_ore',
            'coal', 'charcoal', 'raw_iron', 'raw_copper', 'raw_gold',
            'iron_ingot', 'copper_ingot', 'gold_ingot', 'netherite_ingot',
            'iron_nugget', 'gold_nugget',
            'diamond', 'emerald', 'lapis_lazuli', 'quartz', 'amethyst_shard',
            'redstone', 'glowstone_dust',
            'coal_block', 'iron_block', 'copper_block', 'gold_block', 'diamond_block', 'emerald_block', 'lapis_block', 'redstone_block', 'netherite_block',
            'raw_iron_block', 'raw_copper_block', 'raw_gold_block',
            'amethyst_block', 'budding_amethyst'
        ]
    },
    'Nether': {
        icon: '🔥',
        iconItem: 'netherrack',
        color: '#8B0000',
        items: [
            'netherrack', 'soul_sand', 'soul_soil',
            'basalt', 'smooth_basalt', 'polished_basalt',
            'blackstone', 'polished_blackstone', 'chiseled_polished_blackstone', 'gilded_blackstone', 'polished_blackstone_bricks', 'cracked_polished_blackstone_bricks',
            'nether_bricks', 'red_nether_bricks', 'cracked_nether_bricks', 'chiseled_nether_bricks',
            'magma_block', 'glowstone', 'shroomlight',
            'nether_quartz_ore', 'nether_gold_ore', 'ancient_debris',
            'nether_wart_block', 'warped_wart_block',
            'crimson_fungus', 'warped_fungus', 'crimson_roots', 'warped_roots',
            'nether_sprouts', 'weeping_vines', 'twisting_vines',
            'nether_wart', 'nether_star', 'netherite_scrap',
            'blaze_rod', 'blaze_powder', 'ghast_tear', 'magma_cream',
            'obsidian', 'crying_obsidian'
        ]
    },
    'The End': {
        icon: '🌌',
        iconItem: 'end_stone',
        color: '#D4AF37',
        items: [
            'end_stone', 'end_stone_bricks',
            'purpur_block', 'purpur_pillar',
            'chorus_plant', 'chorus_flower', 'chorus_fruit', 'popped_chorus_fruit',
            'dragon_egg', 'dragon_breath', 'dragon_head',
            'ender_pearl', 'ender_eye', 'end_crystal',
            'shulker_shell', 'elytra',
            'end_portal_frame', 'end_gateway', 'end_rod'
        ]
    },
    'Ocean & Coral': {
        icon: '🌊',
        iconItem: 'brain_coral',
        color: '#0277BD',
        items: [
            'tube_coral', 'brain_coral', 'bubble_coral', 'fire_coral', 'horn_coral',
            'dead_tube_coral', 'dead_brain_coral', 'dead_bubble_coral', 'dead_fire_coral', 'dead_horn_coral',
            'tube_coral_block', 'brain_coral_block', 'bubble_coral_block', 'fire_coral_block', 'horn_coral_block',
            'dead_tube_coral_block', 'dead_brain_coral_block', 'dead_bubble_coral_block', 'dead_fire_coral_block', 'dead_horn_coral_block',
            'tube_coral_fan', 'brain_coral_fan', 'bubble_coral_fan', 'fire_coral_fan', 'horn_coral_fan',
            'dead_tube_coral_fan', 'dead_brain_coral_fan', 'dead_bubble_coral_fan', 'dead_fire_coral_fan', 'dead_horn_coral_fan',
            'seagrass', 'sea_pickle', 'kelp', 'dried_kelp',
            'sea_lantern', 'conduit', 'heart_of_the_sea', 'nautilus_shell',
            'prismarine_shard', 'prismarine_crystals',
            'sponge', 'wet_sponge'
        ]
    },
    'Storage': {
        icon: '📦',
        iconItem: 'chest',
        color: '#795548',
        items: [
            'chest', 'trapped_chest', 'ender_chest', 'barrel',
            'white_shulker_box', 'orange_shulker_box', 'magenta_shulker_box', 'light_blue_shulker_box', 'yellow_shulker_box', 'lime_shulker_box', 'pink_shulker_box', 'gray_shulker_box', 'light_gray_shulker_box', 'cyan_shulker_box', 'purple_shulker_box', 'blue_shulker_box', 'brown_shulker_box', 'green_shulker_box', 'red_shulker_box', 'black_shulker_box', 'shulker_box',
            'hopper'
        ]
    },
    'Functional Blocks': {
        icon: '⚙️',
        iconItem: 'crafting_table',
        color: '#4A90E2',
        items: [
            'crafting_table', 'furnace', 'blast_furnace', 'smoker',
            'anvil', 'chipped_anvil', 'damaged_anvil',
            'grindstone', 'smithing_table', 'cartography_table', 'fletching_table',
            'loom', 'stonecutter', 'cauldron',
            'composter', 'bee_nest', 'beehive',
            'bookshelf', 'chiseled_bookshelf', 'lectern',
            'respawn_anchor', 'lodestone',
            'bell', 'note_block', 'jukebox',
            'beacon', 'spawner',
            'enchanting_table', 'brewing_stand',
            'crafter', 'trial_spawner', 'vault'
        ]
    },
    'Redstone': {
        icon: '🔴',
        iconItem: 'redstone',
        color: '#DC143C',
        items: [
            'redstone_block', 'redstone_torch', 'redstone_lamp',
            'redstone', 'repeater', 'comparator',
            'observer', 'piston', 'sticky_piston',
            'lever', 'tripwire_hook',
            'oak_button', 'spruce_button', 'birch_button', 'jungle_button', 'acacia_button', 'dark_oak_button', 'mangrove_button', 'cherry_button', 'bamboo_button', 'crimson_button', 'warped_button', 'stone_button', 'polished_blackstone_button',
            'oak_pressure_plate', 'spruce_pressure_plate', 'birch_pressure_plate', 'jungle_pressure_plate', 'acacia_pressure_plate', 'dark_oak_pressure_plate', 'mangrove_pressure_plate', 'cherry_pressure_plate', 'bamboo_pressure_plate', 'crimson_pressure_plate', 'warped_pressure_plate', 'stone_pressure_plate', 'polished_blackstone_pressure_plate', 'light_weighted_pressure_plate', 'heavy_weighted_pressure_plate',
            'oak_door', 'spruce_door', 'birch_door', 'jungle_door', 'acacia_door', 'dark_oak_door', 'mangrove_door', 'cherry_door', 'bamboo_door', 'crimson_door', 'warped_door', 'iron_door', 'copper_door', 'exposed_copper_door', 'weathered_copper_door', 'oxidized_copper_door', 'waxed_copper_door', 'waxed_exposed_copper_door', 'waxed_weathered_copper_door', 'waxed_oxidized_copper_door',
            'oak_trapdoor', 'spruce_trapdoor', 'birch_trapdoor', 'jungle_trapdoor', 'acacia_trapdoor', 'dark_oak_trapdoor', 'mangrove_trapdoor', 'cherry_trapdoor', 'bamboo_trapdoor', 'crimson_trapdoor', 'warped_trapdoor', 'iron_trapdoor', 'copper_trapdoor', 'exposed_copper_trapdoor', 'weathered_copper_trapdoor', 'oxidized_copper_trapdoor', 'waxed_copper_trapdoor', 'waxed_exposed_copper_trapdoor', 'waxed_weathered_copper_trapdoor', 'waxed_oxidized_copper_trapdoor',
            'oak_fence_gate', 'spruce_fence_gate', 'birch_fence_gate', 'jungle_fence_gate', 'acacia_fence_gate', 'dark_oak_fence_gate', 'mangrove_fence_gate', 'cherry_fence_gate', 'bamboo_fence_gate', 'crimson_fence_gate', 'warped_fence_gate',
            'daylight_detector', 'sculk_sensor', 'calibrated_sculk_sensor',
            'dropper', 'dispenser',
            'tnt', 'target'
        ]
    },
    'Transportation': {
        icon: '🚂',
        iconItem: 'minecart',
        color: '#696969',
        items: [
            'rail', 'powered_rail', 'detector_rail', 'activator_rail',
            'minecart', 'chest_minecart', 'furnace_minecart', 'hopper_minecart', 'tnt_minecart', 'command_block_minecart',
            'oak_boat', 'spruce_boat', 'birch_boat', 'jungle_boat', 'acacia_boat', 'dark_oak_boat', 'mangrove_boat', 'cherry_boat', 'bamboo_raft',
            'oak_chest_boat', 'spruce_chest_boat', 'birch_chest_boat', 'jungle_chest_boat', 'acacia_chest_boat', 'dark_oak_chest_boat', 'mangrove_chest_boat', 'cherry_chest_boat', 'bamboo_chest_raft',
            'saddle', 'leather_horse_armor', 'iron_horse_armor', 'golden_horse_armor', 'diamond_horse_armor',
            'elytra', 'carrot_on_a_stick', 'warped_fungus_on_a_stick', 'lead', 'name_tag'
        ]
    },
    'Food': {
        icon: '🍎',
        iconItem: 'apple',
        color: '#FF6347',
        items: [
            'apple', 'golden_apple', 'enchanted_golden_apple',
            'melon_slice', 'glistering_melon_slice',
            'sweet_berries', 'glow_berries',
            'carrot', 'golden_carrot', 'potato', 'baked_potato', 'poisonous_potato',
            'beetroot', 'beetroot_soup',
            'bread', 'cookie', 'cake', 'pumpkin_pie',
            'beef', 'cooked_beef', 'porkchop', 'cooked_porkchop', 'mutton', 'cooked_mutton', 'chicken', 'cooked_chicken', 'rabbit', 'cooked_rabbit', 'rabbit_stew',
            'cod', 'cooked_cod', 'salmon', 'cooked_salmon', 'tropical_fish', 'pufferfish',
            'dried_kelp', 'suspicious_stew', 'mushroom_stew',
            'honey_bottle', 'milk_bucket', 'sugar'
        ]
    },
    'Farming': {
        icon: '🌾',
        iconItem: 'wheat',
        color: '#FFC107',
        items: [
            'wheat', 'wheat_seeds', 'beetroot', 'beetroot_seeds',
            'carrot', 'potato', 'poisonous_potato',
            'melon', 'melon_slice', 'melon_seeds',
            'pumpkin', 'carved_pumpkin', 'jack_o_lantern', 'pumpkin_seeds',
            'sugar_cane', 'bamboo', 'cactus',
            'brown_mushroom', 'red_mushroom', 'mushroom_stem', 'brown_mushroom_block', 'red_mushroom_block',
            'nether_wart', 'cocoa_beans',
            'sweet_berries', 'glow_berries',
            'torchflower', 'torchflower_seeds', 'pitcher_plant', 'pitcher_pod',
            'farmland', 'composter', 'hay_block', 'dried_kelp_block'
        ]
    },
    'Brewing & Potions': {
        icon: '⚗️',
        iconItem: 'brewing_stand',
        color: '#9C27B0',
        items: [
            'potion', 'splash_potion', 'lingering_potion',
            'glass_bottle', 'dragon_breath', 'experience_bottle',
            'brewing_stand', 'cauldron',
            'fermented_spider_eye', 'blaze_powder', 'magma_cream',
            'ghast_tear', 'spider_eye', 'glistering_melon_slice', 'golden_carrot',
            'nether_wart', 'redstone', 'glowstone_dust', 'gunpowder',
            'suspicious_stew'
        ]
    },
    'Enchanting': {
        icon: '✨',
        iconItem: 'enchanted_book',
        color: '#7B1FA2',
        items: [
            'enchanting_table', 'bookshelf', 'chiseled_bookshelf',
            'enchanted_book', 'book', 'writable_book', 'written_book', 'knowledge_book',
            'anvil', 'chipped_anvil', 'damaged_anvil', 'grindstone',
            'experience_bottle', 'lapis_lazuli'
        ]
    },
    'Tools & Weapons': {
        icon: '⚔️',
        iconItem: 'diamond_sword',
        color: '#00BCD4',
        items: [
            'wooden_sword', 'stone_sword', 'iron_sword', 'golden_sword', 'diamond_sword', 'netherite_sword',
            'wooden_axe', 'stone_axe', 'iron_axe', 'golden_axe', 'diamond_axe', 'netherite_axe',
            'wooden_pickaxe', 'stone_pickaxe', 'iron_pickaxe', 'golden_pickaxe', 'diamond_pickaxe', 'netherite_pickaxe',
            'wooden_shovel', 'stone_shovel', 'iron_shovel', 'golden_shovel', 'diamond_shovel', 'netherite_shovel',
            'wooden_hoe', 'stone_hoe', 'iron_hoe', 'golden_hoe', 'diamond_hoe', 'netherite_hoe',
            'shears', 'flint_and_steel', 'brush',
            'fishing_rod', 'bow', 'crossbow', 'trident', 'mace',
            'shield', 'totem_of_undying',
            'spyglass', 'compass', 'recovery_compass', 'clock', 'map', 'filled_map'
        ]
    },
    'Armor': {
        icon: '🛡️',
        iconItem: 'diamond_chestplate',
        color: '#4682B4',
        items: [
            'leather_helmet', 'leather_chestplate', 'leather_leggings', 'leather_boots',
            'chainmail_helmet', 'chainmail_chestplate', 'chainmail_leggings', 'chainmail_boots',
            'iron_helmet', 'iron_chestplate', 'iron_leggings', 'iron_boots',
            'golden_helmet', 'golden_chestplate', 'golden_leggings', 'golden_boots',
            'diamond_helmet', 'diamond_chestplate', 'diamond_leggings', 'diamond_boots',
            'netherite_helmet', 'netherite_chestplate', 'netherite_leggings', 'netherite_boots',
            'turtle_helmet', 'wolf_armor'
        ]
    },
    'Combat': {
        icon: '💥',
        iconItem: 'bow',
        color: '#FF4500',
        items: [
            'arrow', 'spectral_arrow', 'tipped_arrow',
            'firework_rocket', 'firework_star', 'fire_charge',
            'snowball', 'egg', 'ender_pearl', 'ender_eye',
            'wind_charge', 'breeze_rod'
        ]
    },
    'Lighting': {
        icon: '💡',
        iconItem: 'torch',
        color: '#FFD54F',
        items: [
            'torch', 'soul_torch', 'redstone_torch',
            'lantern', 'soul_lantern', 'sea_lantern',
            'glowstone', 'shroomlight',
            'jack_o_lantern',
            'candle', 'white_candle', 'orange_candle', 'magenta_candle', 'light_blue_candle', 'yellow_candle', 'lime_candle', 'pink_candle', 'gray_candle', 'light_gray_candle', 'cyan_candle', 'purple_candle', 'blue_candle', 'brown_candle', 'green_candle', 'red_candle', 'black_candle',
            'campfire', 'soul_campfire',
            'end_rod', 'glow_lichen', 'glow_berries', 'glow_ink_sac'
        ]
    },
    'Decorations': {
        icon: '🎨',
        iconItem: 'painting',
        color: '#FF69B4',
        items: [
            'painting', 'item_frame', 'glow_item_frame',
            'armor_stand', 'player_head', 'skeleton_skull', 'wither_skeleton_skull', 'zombie_head', 'creeper_head', 'piglin_head',
            'white_banner', 'orange_banner', 'magenta_banner', 'light_blue_banner', 'yellow_banner', 'lime_banner', 'pink_banner', 'gray_banner', 'light_gray_banner', 'cyan_banner', 'purple_banner', 'blue_banner', 'brown_banner', 'green_banner', 'red_banner', 'black_banner',
            'white_carpet', 'orange_carpet', 'magenta_carpet', 'light_blue_carpet', 'yellow_carpet', 'lime_carpet', 'pink_carpet', 'gray_carpet', 'light_gray_carpet', 'cyan_carpet', 'purple_carpet', 'blue_carpet', 'brown_carpet', 'green_carpet', 'red_carpet', 'black_carpet',
            'white_bed', 'orange_bed', 'magenta_bed', 'light_blue_bed', 'yellow_bed', 'lime_bed', 'pink_bed', 'gray_bed', 'light_gray_bed', 'cyan_bed', 'purple_bed', 'blue_bed', 'brown_bed', 'green_bed', 'red_bed', 'black_bed',
            'flower_pot', 'decorated_pot',
            'dandelion', 'poppy', 'blue_orchid', 'allium', 'azure_bluet', 'red_tulip', 'orange_tulip', 'white_tulip', 'pink_tulip', 'oxeye_daisy', 'cornflower', 'lily_of_the_valley', 'wither_rose', 'pitcher_plant',
            'sunflower', 'lilac', 'rose_bush', 'peony', 'pink_petals', 'spore_blossom',
            'ladder', 'scaffolding', 'vine', 'hanging_roots',
            'lily_pad', 'dead_bush', 'fern', 'large_fern', 'grass', 'tall_grass',
            'cobweb', 'lightning_rod',
            'chain', 'iron_bars', 'glass_pane',
            'white_stained_glass_pane', 'orange_stained_glass_pane', 'magenta_stained_glass_pane', 'light_blue_stained_glass_pane', 'yellow_stained_glass_pane', 'lime_stained_glass_pane', 'pink_stained_glass_pane', 'gray_stained_glass_pane', 'light_gray_stained_glass_pane', 'cyan_stained_glass_pane', 'purple_stained_glass_pane', 'blue_stained_glass_pane', 'brown_stained_glass_pane', 'green_stained_glass_pane', 'red_stained_glass_pane', 'black_stained_glass_pane',
            'oak_sign', 'spruce_sign', 'birch_sign', 'jungle_sign', 'acacia_sign', 'dark_oak_sign', 'mangrove_sign', 'cherry_sign', 'bamboo_sign', 'crimson_sign', 'warped_sign',
            'oak_hanging_sign', 'spruce_hanging_sign', 'birch_hanging_sign', 'jungle_hanging_sign', 'acacia_hanging_sign', 'dark_oak_hanging_sign', 'mangrove_hanging_sign', 'cherry_hanging_sign', 'bamboo_hanging_sign', 'crimson_hanging_sign', 'warped_hanging_sign'
        ]
    },
    'Mob Drops': {
        icon: '🦴',
        iconItem: 'bone',
        color: '#90EE90',
        items: [
            'leather', 'rabbit_hide', 'feather', 'bone', 'string', 'slime_ball',
            'rotten_flesh', 'spider_eye', 'phantom_membrane',
            'shulker_shell', 'scute', 'armadillo_scute',
            'ink_sac', 'glow_ink_sac',
            'echo_shard', 'disc_fragment_5',
            'nether_star', 'dragon_head', 'dragon_egg'
        ]
    },
    'Spawn Eggs': {
        icon: '🥚',
        iconItem: 'pig_spawn_egg',
        color: '#8BC34A',
        items: [
            'allay_spawn_egg', 'axolotl_spawn_egg', 'bat_spawn_egg', 'bee_spawn_egg', 'blaze_spawn_egg', 'cat_spawn_egg', 'camel_spawn_egg', 'cave_spider_spawn_egg', 'chicken_spawn_egg', 'cod_spawn_egg', 'cow_spawn_egg', 'creeper_spawn_egg', 'dolphin_spawn_egg', 'donkey_spawn_egg', 'drowned_spawn_egg', 'elder_guardian_spawn_egg', 'enderman_spawn_egg', 'endermite_spawn_egg', 'evoker_spawn_egg', 'fox_spawn_egg', 'frog_spawn_egg', 'ghast_spawn_egg', 'glow_squid_spawn_egg', 'goat_spawn_egg', 'guardian_spawn_egg', 'hoglin_spawn_egg', 'horse_spawn_egg', 'husk_spawn_egg', 'iron_golem_spawn_egg', 'llama_spawn_egg', 'magma_cube_spawn_egg', 'mooshroom_spawn_egg', 'mule_spawn_egg', 'ocelot_spawn_egg', 'panda_spawn_egg', 'parrot_spawn_egg', 'phantom_spawn_egg', 'pig_spawn_egg', 'piglin_spawn_egg', 'piglin_brute_spawn_egg', 'pillager_spawn_egg', 'polar_bear_spawn_egg', 'pufferfish_spawn_egg', 'rabbit_spawn_egg', 'ravager_spawn_egg', 'salmon_spawn_egg', 'sheep_spawn_egg', 'shulker_spawn_egg', 'silverfish_spawn_egg', 'skeleton_spawn_egg', 'skeleton_horse_spawn_egg', 'slime_spawn_egg', 'sniffer_spawn_egg', 'snow_golem_spawn_egg', 'spider_spawn_egg', 'squid_spawn_egg', 'stray_spawn_egg', 'strider_spawn_egg', 'tadpole_spawn_egg', 'trader_llama_spawn_egg', 'tropical_fish_spawn_egg', 'turtle_spawn_egg', 'vex_spawn_egg', 'villager_spawn_egg', 'vindicator_spawn_egg', 'wandering_trader_spawn_egg', 'warden_spawn_egg', 'witch_spawn_egg', 'wither_skeleton_spawn_egg', 'wolf_spawn_egg', 'zoglin_spawn_egg', 'zombie_spawn_egg', 'zombie_horse_spawn_egg', 'zombie_villager_spawn_egg', 'zombified_piglin_spawn_egg', 'armadillo_spawn_egg', 'bogged_spawn_egg', 'breeze_spawn_egg',
            'sniffer_egg'
        ]
    },
    'Music Discs': {
        icon: '🎵',
        iconItem: 'music_disc_cat',
        color: '#9370DB',
        items: [
            'music_disc_13', 'music_disc_cat', 'music_disc_blocks', 'music_disc_chirp', 'music_disc_far', 'music_disc_mall', 'music_disc_mellohi', 'music_disc_stal', 'music_disc_strad', 'music_disc_ward', 'music_disc_11', 'music_disc_wait', 'music_disc_otherside', 'music_disc_5', 'music_disc_pigstep', 'music_disc_relic', 'music_disc_creator', 'music_disc_creator_music_box', 'music_disc_precipice',
            'goat_horn'
        ]
    },
    'Dyes': {
        icon: '🎨',
        iconItem: 'red_dye',
        color: '#FF1493',
        items: [
            'white_dye', 'orange_dye', 'magenta_dye', 'light_blue_dye', 'yellow_dye', 'lime_dye', 'pink_dye', 'gray_dye', 'light_gray_dye', 'cyan_dye', 'purple_dye', 'blue_dye', 'brown_dye', 'green_dye', 'red_dye', 'black_dye',
            'bone_meal', 'ink_sac', 'glow_ink_sac', 'lapis_lazuli', 'cocoa_beans'
        ]
    },
    'Miscellaneous': {
        icon: '📦',
        iconItem: 'ender_pearl',
        color: '#808080',
        items: [
            'bucket', 'water_bucket', 'lava_bucket', 'powder_snow_bucket', 'axolotl_bucket', 'cod_bucket', 'salmon_bucket', 'pufferfish_bucket', 'tropical_fish_bucket', 'tadpole_bucket',
            'stick', 'bowl', 'paper',
            'lead', 'name_tag',
            'brick', 'nether_brick', 'clay_ball',
            'flint', 'gunpowder',
            'rabbit_foot', 'honeycomb',
            'trial_key', 'ominous_trial_key', 'heavy_core', 'flow_banner_pattern', 'guster_banner_pattern',
            'angler_pottery_sherd', 'archer_pottery_sherd', 'arms_up_pottery_sherd', 'blade_pottery_sherd', 'brewer_pottery_sherd', 'burn_pottery_sherd', 'danger_pottery_sherd', 'explorer_pottery_sherd', 'flow_pottery_sherd', 'friend_pottery_sherd', 'guster_pottery_sherd', 'heart_pottery_sherd', 'heartbreak_pottery_sherd', 'howl_pottery_sherd', 'miner_pottery_sherd', 'mourner_pottery_sherd', 'plenty_pottery_sherd', 'prize_pottery_sherd', 'scrape_pottery_sherd', 'sheaf_pottery_sherd', 'shelter_pottery_sherd', 'skull_pottery_sherd', 'snort_pottery_sherd',
            'banner_pattern', 'creeper_banner_pattern', 'skull_banner_pattern', 'flower_banner_pattern', 'mojang_banner_pattern', 'globe_banner_pattern', 'piglin_banner_pattern',
            'netherite_upgrade_smithing_template', 'coast_armor_trim_smithing_template', 'dune_armor_trim_smithing_template', 'eye_armor_trim_smithing_template', 'host_armor_trim_smithing_template', 'raiser_armor_trim_smithing_template', 'rib_armor_trim_smithing_template', 'sentry_armor_trim_smithing_template', 'shaper_armor_trim_smithing_template', 'silence_armor_trim_smithing_template', 'snout_armor_trim_smithing_template', 'spire_armor_trim_smithing_template', 'tide_armor_trim_smithing_template', 'vex_armor_trim_smithing_template', 'ward_armor_trim_smithing_template', 'wayfinder_armor_trim_smithing_template', 'wild_armor_trim_smithing_template', 'flow_armor_trim_smithing_template', 'bolt_armor_trim_smithing_template',
            'debug_stick', 'command_block', 'chain_command_block', 'repeating_command_block', 'command_block_minecart', 'structure_block', 'structure_void', 'jigsaw', 'barrier', 'light',
            'slime_block', 'honey_block'
        ]
    }
};

// Create a reverse lookup: item -> categories[]
const ITEM_TO_CATEGORIES = {};
for (const [category, data] of Object.entries(MINECRAFT_ITEM_CATEGORIES)) {
    data.items.forEach(item => {
        if (!ITEM_TO_CATEGORIES[item]) {
            ITEM_TO_CATEGORIES[item] = [];
        }
        ITEM_TO_CATEGORIES[item].push(category);
    });
}

// Expose globally
window.MINECRAFT_ITEM_CATEGORIES = MINECRAFT_ITEM_CATEGORIES;
window.ITEM_TO_CATEGORIES = ITEM_TO_CATEGORIES;

/**
 * Get combined item categories including MythicMobs items
 * @param {boolean} includeMythicMobs - Include MythicMobs items category
 * @returns {Object} Categories object for SearchableDropdown
 */
window.getCombinedItemCategories = function(includeMythicMobs = true) {
    const combined = {};
    
    // Add MythicMobs category first if requested
    if (includeMythicMobs) {
        const items = window.editor?.state?.items || [];
        const mythicItems = items.filter(item => 
            !item._isFileContainer && item.internalName
        );
        
        if (mythicItems.length > 0) {
            // Use first item's material for the category icon, or fallback
            const firstItemMaterial = mythicItems[0].Id || 'diamond_sword';
            
            combined['MythicMobs Items'] = {
                icon: '🔮',
                iconItem: firstItemMaterial,
                color: '#9C27B0',
                items: mythicItems.map(item => item.internalName),
                isMythicMobs: true // Flag for special handling
            };
        }
    }
    
    // Add Minecraft categories
    if (window.MINECRAFT_ITEM_CATEGORIES) {
        Object.assign(combined, window.MINECRAFT_ITEM_CATEGORIES);
    }
    
    return combined;
};
