/**
 * Minecraft 1.21.1+ Sound Registry
 * All sounds in dot-notation format (e.g. entity.zombie.ambient)
 * Used by the Sound mechanic selector in MythicMobs Editor.
 *
 * Format: category.subcategory.action
 * Organized for quick search and browsing.
 */

const MINECRAFT_SOUNDS = {
    // ═══════════════════════════════════════════════════════════
    // AMBIENT
    // ═══════════════════════════════════════════════════════════
    ambient: {
        label: 'Ambient',
        color: '#06b6d4',
        icon: '🌍',
        sounds: [
            'ambient.basalt_deltas.additions',
            'ambient.basalt_deltas.loop',
            'ambient.basalt_deltas.mood',
            'ambient.cave',
            'ambient.crimson_forest.additions',
            'ambient.crimson_forest.loop',
            'ambient.crimson_forest.mood',
            'ambient.nether_wastes.additions',
            'ambient.nether_wastes.loop',
            'ambient.nether_wastes.mood',
            'ambient.soul_sand_valley.additions',
            'ambient.soul_sand_valley.loop',
            'ambient.soul_sand_valley.mood',
            'ambient.underwater.enter',
            'ambient.underwater.exit',
            'ambient.underwater.loop',
            'ambient.underwater.loop.additions',
            'ambient.underwater.loop.additions.rare',
            'ambient.underwater.loop.additions.ultra_rare',
            'ambient.warped_forest.additions',
            'ambient.warped_forest.loop',
            'ambient.warped_forest.mood',
        ]
    },

    // ═══════════════════════════════════════════════════════════
    // BLOCK
    // ═══════════════════════════════════════════════════════════
    block: {
        label: 'Block',
        color: '#8b5cf6',
        icon: '🧱',
        sounds: [
            // Amethyst
            'block.amethyst_block.break', 'block.amethyst_block.chime', 'block.amethyst_block.fall',
            'block.amethyst_block.hit', 'block.amethyst_block.place', 'block.amethyst_block.step',
            'block.amethyst_cluster.break', 'block.amethyst_cluster.fall', 'block.amethyst_cluster.hit',
            'block.amethyst_cluster.place', 'block.amethyst_cluster.step',
            // Ancient Debris
            'block.ancient_debris.break', 'block.ancient_debris.fall', 'block.ancient_debris.hit',
            'block.ancient_debris.place', 'block.ancient_debris.step',
            // Anvil
            'block.anvil.break', 'block.anvil.destroy', 'block.anvil.fall', 'block.anvil.hit',
            'block.anvil.land', 'block.anvil.place', 'block.anvil.step', 'block.anvil.use',
            // Azalea
            'block.azalea.break', 'block.azalea.fall', 'block.azalea.hit', 'block.azalea.place', 'block.azalea.step',
            'block.azalea_leaves.break', 'block.azalea_leaves.fall', 'block.azalea_leaves.hit',
            'block.azalea_leaves.place', 'block.azalea_leaves.step',
            // Bamboo
            'block.bamboo.break', 'block.bamboo.fall', 'block.bamboo.hit', 'block.bamboo.place', 'block.bamboo.step',
            'block.bamboo_sapling.break', 'block.bamboo_sapling.hit', 'block.bamboo_sapling.place',
            'block.bamboo_wood.break', 'block.bamboo_wood.fall', 'block.bamboo_wood.hit',
            'block.bamboo_wood.place', 'block.bamboo_wood.step',
            'block.bamboo_wood_door.close', 'block.bamboo_wood_door.open',
            'block.bamboo_wood_fence_gate.close', 'block.bamboo_wood_fence_gate.open',
            'block.bamboo_wood_hanging_sign.break', 'block.bamboo_wood_hanging_sign.fall',
            'block.bamboo_wood_hanging_sign.hit', 'block.bamboo_wood_hanging_sign.place', 'block.bamboo_wood_hanging_sign.step',
            'block.bamboo_wood_pressure_plate.click_off', 'block.bamboo_wood_pressure_plate.click_on',
            'block.bamboo_wood_trapdoor.close', 'block.bamboo_wood_trapdoor.open',
            // Barrel
            'block.barrel.close', 'block.barrel.open',
            // Basalt
            'block.basalt.break', 'block.basalt.fall', 'block.basalt.hit', 'block.basalt.place', 'block.basalt.step',
            // Beacon
            'block.beacon.activate', 'block.beacon.ambient', 'block.beacon.deactivate', 'block.beacon.power_select',
            // Bell
            'block.bell.resonate', 'block.bell.use',
            // Big Dripleaf
            'block.big_dripleaf.break', 'block.big_dripleaf.fall', 'block.big_dripleaf.hit',
            'block.big_dripleaf.place', 'block.big_dripleaf.step', 'block.big_dripleaf.tilt_down', 'block.big_dripleaf.tilt_up',
            // Blastfurnace
            'block.blastfurnace.fire_crackle',
            // Bone Block
            'block.bone_block.break', 'block.bone_block.fall', 'block.bone_block.hit', 'block.bone_block.place', 'block.bone_block.step',
            // Brewing Stand
            'block.brewing_stand.brew',
            // Bubble Column
            'block.bubble_column.bubble_pop', 'block.bubble_column.upwards_ambient',
            'block.bubble_column.upwards_inside', 'block.bubble_column.whirlpool_ambient',
            'block.bubble_column.whirlpool_inside',
            // Buttons & Pressure Plates
            'block.stone_button.click_off', 'block.stone_button.click_on',
            'block.wooden_button.click_off', 'block.wooden_button.click_on',
            'block.stone_pressure_plate.click_off', 'block.stone_pressure_plate.click_on',
            'block.wooden_pressure_plate.click_off', 'block.wooden_pressure_plate.click_on',
            'block.polished_deepslate_pressure_plate.click_off', 'block.polished_deepslate_pressure_plate.click_on',
            // Cactus
            'block.cactus.break', 'block.cactus.fall', 'block.cactus.hit', 'block.cactus.place', 'block.cactus.step',
            // Cake
            'block.cake.add_candle',
            // Calcite
            'block.calcite.break', 'block.calcite.fall', 'block.calcite.hit', 'block.calcite.place', 'block.calcite.step',
            // Campfire
            'block.campfire.crackle',
            // Candle
            'block.candle.ambient', 'block.candle.break', 'block.candle.extinguish', 'block.candle.fall',
            'block.candle.hit', 'block.candle.place', 'block.candle.step',
            // Cave Vines
            'block.cave_vines.break', 'block.cave_vines.fall', 'block.cave_vines.hit',
            'block.cave_vines.pick_berries', 'block.cave_vines.place', 'block.cave_vines.step',
            // Chain
            'block.chain.break', 'block.chain.fall', 'block.chain.hit', 'block.chain.place', 'block.chain.step',
            // Cherry
            'block.cherry_leaves.break', 'block.cherry_leaves.fall', 'block.cherry_leaves.hit',
            'block.cherry_leaves.place', 'block.cherry_leaves.step',
            'block.cherry_wood.break', 'block.cherry_wood.fall', 'block.cherry_wood.hit',
            'block.cherry_wood.place', 'block.cherry_wood.step',
            'block.cherry_wood_door.close', 'block.cherry_wood_door.open',
            'block.cherry_wood_fence_gate.close', 'block.cherry_wood_fence_gate.open',
            'block.cherry_wood_hanging_sign.break', 'block.cherry_wood_hanging_sign.fall',
            'block.cherry_wood_hanging_sign.hit', 'block.cherry_wood_hanging_sign.place', 'block.cherry_wood_hanging_sign.step',
            'block.cherry_wood_pressure_plate.click_off', 'block.cherry_wood_pressure_plate.click_on',
            'block.cherry_wood_trapdoor.close', 'block.cherry_wood_trapdoor.open',
            // Chest
            'block.chest.close', 'block.chest.locked', 'block.chest.open',
            'block.ender_chest.close', 'block.ender_chest.open',
            'block.trapped_chest.close', 'block.trapped_chest.open',
            // Chiseled Bookshelf
            'block.chiseled_bookshelf.break', 'block.chiseled_bookshelf.fall', 'block.chiseled_bookshelf.hit',
            'block.chiseled_bookshelf.insert', 'block.chiseled_bookshelf.insert.enchanted',
            'block.chiseled_bookshelf.pickup', 'block.chiseled_bookshelf.pickup.enchanted',
            'block.chiseled_bookshelf.place', 'block.chiseled_bookshelf.step',
            // Chorus
            'block.chorus_flower.death', 'block.chorus_flower.grow',
            // Cobweb
            'block.cobweb.break', 'block.cobweb.fall', 'block.cobweb.hit', 'block.cobweb.place', 'block.cobweb.step',
            // Comparator
            'block.comparator.click',
            // Composter
            'block.composter.empty', 'block.composter.fill', 'block.composter.fill_success', 'block.composter.ready',
            // Conduit
            'block.conduit.activate', 'block.conduit.ambient', 'block.conduit.ambient.short',
            'block.conduit.attack.target', 'block.conduit.deactivate',
            // Copper
            'block.copper.break', 'block.copper.fall', 'block.copper.hit', 'block.copper.place', 'block.copper.step',
            'block.copper_bulb.break', 'block.copper_bulb.fall', 'block.copper_bulb.hit',
            'block.copper_bulb.place', 'block.copper_bulb.step',
            'block.copper_bulb.turn_off', 'block.copper_bulb.turn_on',
            'block.copper_door.close', 'block.copper_door.open',
            'block.copper_grate.break', 'block.copper_grate.fall', 'block.copper_grate.hit',
            'block.copper_grate.place', 'block.copper_grate.step',
            'block.copper_trapdoor.close', 'block.copper_trapdoor.open',
            // Coral
            'block.coral_block.break', 'block.coral_block.fall', 'block.coral_block.hit', 'block.coral_block.place', 'block.coral_block.step',
            // Crop
            'block.crop.break',
            // Decorated Pot
            'block.decorated_pot.break', 'block.decorated_pot.fall', 'block.decorated_pot.hit',
            'block.decorated_pot.insert', 'block.decorated_pot.insert_fail',
            'block.decorated_pot.place', 'block.decorated_pot.shatter', 'block.decorated_pot.step',
            // Deepslate
            'block.deepslate.break', 'block.deepslate.fall', 'block.deepslate.hit', 'block.deepslate.place', 'block.deepslate.step',
            'block.deepslate_bricks.break', 'block.deepslate_bricks.fall', 'block.deepslate_bricks.hit',
            'block.deepslate_bricks.place', 'block.deepslate_bricks.step',
            'block.deepslate_tiles.break', 'block.deepslate_tiles.fall', 'block.deepslate_tiles.hit',
            'block.deepslate_tiles.place', 'block.deepslate_tiles.step',
            // Dirt
            'block.dirt.break', 'block.dirt.fall', 'block.dirt.hit', 'block.dirt.place', 'block.dirt.step',
            'block.rooted_dirt.break', 'block.rooted_dirt.fall', 'block.rooted_dirt.hit',
            'block.rooted_dirt.place', 'block.rooted_dirt.step',
            // Dispenser
            'block.dispenser.dispense', 'block.dispenser.fail', 'block.dispenser.launch',
            // Door
            'block.iron_door.close', 'block.iron_door.open',
            'block.wooden_door.close', 'block.wooden_door.open',
            'block.crimson_door.close', 'block.crimson_door.open',
            'block.warped_door.close', 'block.warped_door.open',
            'block.mangrove_door.close', 'block.mangrove_door.open',
            // Dripstone
            'block.dripstone_block.break', 'block.dripstone_block.fall', 'block.dripstone_block.hit',
            'block.dripstone_block.place', 'block.dripstone_block.step',
            'block.pointed_dripstone.break', 'block.pointed_dripstone.drip_lava',
            'block.pointed_dripstone.drip_lava_into_cauldron', 'block.pointed_dripstone.drip_water',
            'block.pointed_dripstone.drip_water_into_cauldron', 'block.pointed_dripstone.fall',
            'block.pointed_dripstone.hit', 'block.pointed_dripstone.land', 'block.pointed_dripstone.place',
            'block.pointed_dripstone.step',
            // Enchanting Table
            'block.enchantment_table.use',
            // End
            'block.end_gateway.spawn', 'block.end_portal.spawn', 'block.end_portal_frame.fill',
            // Fire
            'block.fire.ambient', 'block.fire.extinguish',
            // Flower Pot
            'block.flower_pot.break', 'block.flower_pot.fall', 'block.flower_pot.hit',
            'block.flower_pot.place', 'block.flower_pot.step',
            // Froglight
            'block.froglight.break', 'block.froglight.fall', 'block.froglight.hit',
            'block.froglight.place', 'block.froglight.step',
            // Frosted Ice
            'block.frosted_ice.break', 'block.frosted_ice.crack',
            // Fungus
            'block.fungus.break', 'block.fungus.fall', 'block.fungus.hit', 'block.fungus.place', 'block.fungus.step',
            // Generic Blocks
            'block.generic.break', 'block.generic.fall', 'block.generic.footsteps', 'block.generic.hit', 'block.generic.place',
            // Glass
            'block.glass.break', 'block.glass.fall', 'block.glass.hit', 'block.glass.place', 'block.glass.step',
            // Grass
            'block.grass.break', 'block.grass.fall', 'block.grass.hit', 'block.grass.place', 'block.grass.step',
            // Gravel
            'block.gravel.break', 'block.gravel.fall', 'block.gravel.hit', 'block.gravel.place', 'block.gravel.step',
            // Grindstone
            'block.grindstone.use',
            // Hanging Sign
            'block.hanging_sign.break', 'block.hanging_sign.fall', 'block.hanging_sign.hit',
            'block.hanging_sign.place', 'block.hanging_sign.step',
            // Hay Block
            'block.hay_block.break', 'block.hay_block.fall', 'block.hay_block.hit', 'block.hay_block.place', 'block.hay_block.step',
            // Honey Block
            'block.honey_block.break', 'block.honey_block.fall', 'block.honey_block.hit', 'block.honey_block.place', 'block.honey_block.step',
            'block.honey_block.slide',
            // Hive
            'block.beehive.drip', 'block.beehive.enter', 'block.beehive.exit',
            'block.beehive.shear', 'block.beehive.work',
            // Ice
            'block.ice.break', 'block.ice.step',
            // Iron
            'block.iron_trapdoor.close', 'block.iron_trapdoor.open',
            // Ladder
            'block.ladder.break', 'block.ladder.fall', 'block.ladder.hit', 'block.ladder.place', 'block.ladder.step',
            // Large Amethyst Bud
            'block.large_amethyst_bud.break', 'block.large_amethyst_bud.place',
            // Lava
            'block.lava.ambient', 'block.lava.extinguish', 'block.lava.pop',
            // Lever
            'block.lever.click',
            // Lily Pad
            'block.lily_pad.place',
            // Lodestone
            'block.lodestone.break', 'block.lodestone.fall', 'block.lodestone.hit', 'block.lodestone.place', 'block.lodestone.step',
            // Mangrove
            'block.mangrove_roots.break', 'block.mangrove_roots.fall', 'block.mangrove_roots.hit',
            'block.mangrove_roots.place', 'block.mangrove_roots.step',
            // Medium Amethyst Bud
            'block.medium_amethyst_bud.break', 'block.medium_amethyst_bud.place',
            // Metal
            'block.metal.break', 'block.metal.fall', 'block.metal.hit', 'block.metal.place', 'block.metal.step',
            'block.metal_pressure_plate.click_off', 'block.metal_pressure_plate.click_on',
            // Moss
            'block.moss.break', 'block.moss.fall', 'block.moss.hit', 'block.moss.place', 'block.moss.step',
            'block.moss_carpet.break', 'block.moss_carpet.fall', 'block.moss_carpet.hit',
            'block.moss_carpet.place', 'block.moss_carpet.step',
            // Mud
            'block.mud.break', 'block.mud.fall', 'block.mud.hit', 'block.mud.place', 'block.mud.step',
            'block.mud_bricks.break', 'block.mud_bricks.fall', 'block.mud_bricks.hit',
            'block.mud_bricks.place', 'block.mud_bricks.step',
            'block.muddy_mangrove_roots.break', 'block.muddy_mangrove_roots.fall', 'block.muddy_mangrove_roots.hit',
            'block.muddy_mangrove_roots.place', 'block.muddy_mangrove_roots.step',
            // Nether
            'block.nether_bricks.break', 'block.nether_bricks.fall', 'block.nether_bricks.hit',
            'block.nether_bricks.place', 'block.nether_bricks.step',
            'block.nether_gold_ore.break', 'block.nether_gold_ore.fall', 'block.nether_gold_ore.hit',
            'block.nether_gold_ore.place', 'block.nether_gold_ore.step',
            'block.nether_ore.break', 'block.nether_ore.fall', 'block.nether_ore.hit',
            'block.nether_ore.place', 'block.nether_ore.step',
            'block.nether_sprouts.break', 'block.nether_sprouts.fall', 'block.nether_sprouts.hit',
            'block.nether_sprouts.place', 'block.nether_sprouts.step',
            'block.nether_wart.break', 'block.nether_wood.break', 'block.nether_wood.fall',
            'block.nether_wood.hit', 'block.nether_wood.place', 'block.nether_wood.step',
            'block.nether_wood_door.close', 'block.nether_wood_door.open',
            'block.nether_wood_fence_gate.close', 'block.nether_wood_fence_gate.open',
            'block.nether_wood_hanging_sign.break', 'block.nether_wood_hanging_sign.fall',
            'block.nether_wood_hanging_sign.hit', 'block.nether_wood_hanging_sign.place',
            'block.nether_wood_hanging_sign.step',
            'block.nether_wood_pressure_plate.click_off', 'block.nether_wood_pressure_plate.click_on',
            'block.nether_wood_trapdoor.close', 'block.nether_wood_trapdoor.open',
            // Netherrack
            'block.netherrack.break', 'block.netherrack.fall', 'block.netherrack.hit',
            'block.netherrack.place', 'block.netherrack.step',
            // Note Block
            'block.note_block.banjo', 'block.note_block.basedrum', 'block.note_block.bass',
            'block.note_block.bell', 'block.note_block.bit', 'block.note_block.chime',
            'block.note_block.cow_bell', 'block.note_block.didgeridoo', 'block.note_block.flute',
            'block.note_block.guitar', 'block.note_block.harp', 'block.note_block.hat',
            'block.note_block.iron_xylophone', 'block.note_block.pling', 'block.note_block.snare',
            'block.note_block.xylophone',
            // Nylium
            'block.nylium.break', 'block.nylium.fall', 'block.nylium.hit', 'block.nylium.place', 'block.nylium.step',
            // Packed Ice
            'block.packed_ice.break', 'block.packed_ice.fall', 'block.packed_ice.hit',
            'block.packed_ice.place', 'block.packed_ice.step',
            // Piston
            'block.piston.contract', 'block.piston.extend',
            // Plant
            'block.plant.break', 'block.plant.fall', 'block.plant.hit', 'block.plant.place', 'block.plant.step',
            // Polished Deepslate
            'block.polished_deepslate.break', 'block.polished_deepslate.fall', 'block.polished_deepslate.hit',
            'block.polished_deepslate.place', 'block.polished_deepslate.step',
            // Portal
            'block.portal.ambient', 'block.portal.travel', 'block.portal.trigger',
            // Powder Snow
            'block.powder_snow.break', 'block.powder_snow.fall', 'block.powder_snow.hit',
            'block.powder_snow.place', 'block.powder_snow.step',
            // Rail
            'block.rail.place',
            // Respawn Anchor
            'block.respawn_anchor.ambient', 'block.respawn_anchor.charge',
            'block.respawn_anchor.deplete', 'block.respawn_anchor.set_spawn',
            // Rooted Dirt
            'block.rooted_dirt.break', 'block.rooted_dirt.fall', 'block.rooted_dirt.hit',
            'block.rooted_dirt.place', 'block.rooted_dirt.step',
            // Sand
            'block.sand.break', 'block.sand.fall', 'block.sand.hit', 'block.sand.place', 'block.sand.step',
            // Scaffolding
            'block.scaffolding.break', 'block.scaffolding.fall', 'block.scaffolding.hit',
            'block.scaffolding.place', 'block.scaffolding.step',
            // Sculk
            'block.sculk.break', 'block.sculk.charge', 'block.sculk.fall', 'block.sculk.hit',
            'block.sculk.place', 'block.sculk.spread', 'block.sculk.step',
            'block.sculk_catalyst.bloom', 'block.sculk_catalyst.break', 'block.sculk_catalyst.fall',
            'block.sculk_catalyst.hit', 'block.sculk_catalyst.place', 'block.sculk_catalyst.step',
            'block.sculk_sensor.break', 'block.sculk_sensor.clicking', 'block.sculk_sensor.clicking_stop',
            'block.sculk_sensor.fall', 'block.sculk_sensor.hit', 'block.sculk_sensor.place', 'block.sculk_sensor.step',
            'block.sculk_shrieker.break', 'block.sculk_shrieker.fall', 'block.sculk_shrieker.hit',
            'block.sculk_shrieker.place', 'block.sculk_shrieker.shriek', 'block.sculk_shrieker.step',
            'block.sculk_vein.break', 'block.sculk_vein.fall', 'block.sculk_vein.hit',
            'block.sculk_vein.place', 'block.sculk_vein.step',
            // Shroomlight
            'block.shroomlight.break', 'block.shroomlight.fall', 'block.shroomlight.hit',
            'block.shroomlight.place', 'block.shroomlight.step',
            // Shulker Box
            'block.shulker_box.close', 'block.shulker_box.open',
            // Slime Block
            'block.slime_block.break', 'block.slime_block.fall', 'block.slime_block.hit',
            'block.slime_block.place', 'block.slime_block.step',
            // Small Amethyst Bud
            'block.small_amethyst_bud.break', 'block.small_amethyst_bud.place',
            // Small Dripleaf
            'block.small_dripleaf.break', 'block.small_dripleaf.fall', 'block.small_dripleaf.hit',
            'block.small_dripleaf.place', 'block.small_dripleaf.step',
            // Smithing Table
            'block.smithing_table.use',
            // Smoker
            'block.smoker.smoke',
            // Snow
            'block.snow.break', 'block.snow.fall', 'block.snow.hit', 'block.snow.place', 'block.snow.step',
            // Soul Sand
            'block.soul_sand.break', 'block.soul_sand.fall', 'block.soul_sand.hit',
            'block.soul_sand.place', 'block.soul_sand.step',
            'block.soul_soil.break', 'block.soul_soil.fall', 'block.soul_soil.hit',
            'block.soul_soil.place', 'block.soul_soil.step',
            // Sponge
            'block.sponge.absorb', 'block.sponge.break', 'block.sponge.fall', 'block.sponge.hit',
            'block.sponge.place', 'block.sponge.step',
            // Stem
            'block.stem.break', 'block.stem.fall', 'block.stem.hit', 'block.stem.place', 'block.stem.step',
            // Stone
            'block.stone.break', 'block.stone.fall', 'block.stone.hit', 'block.stone.place', 'block.stone.step',
            'block.stone_bricks.break', 'block.stone_bricks.fall', 'block.stone_bricks.hit',
            'block.stone_bricks.place', 'block.stone_bricks.step',
            // Suspicious
            'block.suspicious_gravel.break', 'block.suspicious_gravel.fall', 'block.suspicious_gravel.hit',
            'block.suspicious_gravel.place', 'block.suspicious_gravel.step',
            'block.suspicious_sand.break', 'block.suspicious_sand.fall', 'block.suspicious_sand.hit',
            'block.suspicious_sand.place', 'block.suspicious_sand.step',
            'block.suspicious_gravel.slide', 'block.suspicious_sand.slide',
            // Sweet Berry Bush
            'block.sweet_berry_bush.break', 'block.sweet_berry_bush.place', 'block.sweet_berry_bush.pick_berries',
            // Tuff
            'block.tuff.break', 'block.tuff.fall', 'block.tuff.hit', 'block.tuff.place', 'block.tuff.step',
            'block.tuff_bricks.break', 'block.tuff_bricks.fall', 'block.tuff_bricks.hit',
            'block.tuff_bricks.place', 'block.tuff_bricks.step',
            // Trial spawner (1.21)
            'block.trial_spawner.about_to_spawn_item', 'block.trial_spawner.ambient',
            'block.trial_spawner.ambient_ominous', 'block.trial_spawner.break',
            'block.trial_spawner.close_shutter', 'block.trial_spawner.detect_player',
            'block.trial_spawner.eject_item', 'block.trial_spawner.fall',
            'block.trial_spawner.hit', 'block.trial_spawner.open_shutter',
            'block.trial_spawner.place', 'block.trial_spawner.spawn_mob',
            'block.trial_spawner.step',
            // Vault (1.21)
            'block.vault.activate', 'block.vault.ambient', 'block.vault.break',
            'block.vault.close_shutter', 'block.vault.deactivate', 'block.vault.eject_item',
            'block.vault.fall', 'block.vault.hit', 'block.vault.insert_item',
            'block.vault.insert_item_fail', 'block.vault.open_shutter',
            'block.vault.place', 'block.vault.reject_rewarded_player', 'block.vault.step',
            // Creaking Heart (1.21.4)
            'block.creaking_heart.break', 'block.creaking_heart.fall', 'block.creaking_heart.hurt',
            'block.creaking_heart.idle', 'block.creaking_heart.place', 'block.creaking_heart.step',
            'block.creaking_heart.spawn',
            // Vines
            'block.vine.break', 'block.vine.fall', 'block.vine.hit', 'block.vine.place', 'block.vine.step',
            // Water
            'block.water.ambient',
            // Wet Grass
            'block.wet_grass.break', 'block.wet_grass.fall', 'block.wet_grass.hit',
            'block.wet_grass.place', 'block.wet_grass.step',
            // Wet Sponge
            'block.wet_sponge.break', 'block.wet_sponge.fall', 'block.wet_sponge.hit',
            'block.wet_sponge.place', 'block.wet_sponge.step',
            // Wood
            'block.wood.break', 'block.wood.fall', 'block.wood.hit', 'block.wood.place', 'block.wood.step',
            'block.wooden_trapdoor.close', 'block.wooden_trapdoor.open',
            // Fence Gate
            'block.fence_gate.close', 'block.fence_gate.open',
            // Wool
            'block.wool.break', 'block.wool.fall', 'block.wool.hit', 'block.wool.place', 'block.wool.step',
        ]
    },

    // ═══════════════════════════════════════════════════════════
    // ENCHANT
    // ═══════════════════════════════════════════════════════════
    enchant: {
        label: 'Enchant',
        color: '#a855f7',
        icon: '✨',
        sounds: [
            'enchant.thorns.hit',
        ]
    },

    // ═══════════════════════════════════════════════════════════
    // ENTITY
    // ═══════════════════════════════════════════════════════════
    entity: {
        label: 'Entity',
        color: '#ef4444',
        icon: '👾',
        sounds: [
            // Allay
            'entity.allay.ambient_with_item', 'entity.allay.ambient_without_item',
            'entity.allay.death', 'entity.allay.hurt', 'entity.allay.item_given',
            'entity.allay.item_taken', 'entity.allay.item_thrown',
            // Armor Stand
            'entity.armor_stand.break', 'entity.armor_stand.fall', 'entity.armor_stand.hit', 'entity.armor_stand.place',
            // Arrow
            'entity.arrow.hit', 'entity.arrow.hit_player', 'entity.arrow.shoot',
            'entity.spectral_arrow.hit', 'entity.spectral_arrow.shoot',
            // Armadillo (1.20.5+)
            'entity.armadillo.ambient', 'entity.armadillo.brush',
            'entity.armadillo.death', 'entity.armadillo.eat',
            'entity.armadillo.hurt', 'entity.armadillo.hurt_reduced',
            'entity.armadillo.land', 'entity.armadillo.peek',
            'entity.armadillo.roll', 'entity.armadillo.scute_drop',
            'entity.armadillo.step', 'entity.armadillo.unroll_finish',
            'entity.armadillo.unroll_start',
            // Axolotl
            'entity.axolotl.attack', 'entity.axolotl.death', 'entity.axolotl.hurt',
            'entity.axolotl.idle_air', 'entity.axolotl.idle_water', 'entity.axolotl.splash',
            'entity.axolotl.swim',
            // Bat
            'entity.bat.ambient', 'entity.bat.death', 'entity.bat.hurt', 'entity.bat.loop',
            'entity.bat.takeoff',
            // Bee
            'entity.bee.death', 'entity.bee.hurt', 'entity.bee.loop', 'entity.bee.loop_aggressive',
            'entity.bee.pollinate', 'entity.bee.sting',
            // Blaze
            'entity.blaze.ambient', 'entity.blaze.burn', 'entity.blaze.death',
            'entity.blaze.hurt', 'entity.blaze.shoot',
            // Boat
            'entity.boat.paddle_land', 'entity.boat.paddle_water',
            'entity.chest_boat.place',
            // Bogged (1.21)
            'entity.bogged.ambient', 'entity.bogged.death', 'entity.bogged.hurt',
            'entity.bogged.shear', 'entity.bogged.step',
            // Breeze (1.21)
            'entity.breeze.charge', 'entity.breeze.death', 'entity.breeze.deflect',
            'entity.breeze.hurt', 'entity.breeze.idle_air', 'entity.breeze.idle_ground',
            'entity.breeze.inhale', 'entity.breeze.jump', 'entity.breeze.land',
            'entity.breeze.shoot', 'entity.breeze.slide', 'entity.breeze.whirl',
            'entity.breeze.wind_burst',
            // Camel
            'entity.camel.ambient', 'entity.camel.dash', 'entity.camel.dash_ready',
            'entity.camel.death', 'entity.camel.eat', 'entity.camel.hurt',
            'entity.camel.saddle', 'entity.camel.sit', 'entity.camel.stand',
            'entity.camel.step', 'entity.camel.step_sand',
            // Cat
            'entity.cat.ambient', 'entity.cat.beg_for_food', 'entity.cat.death',
            'entity.cat.eat', 'entity.cat.hiss', 'entity.cat.hurt',
            'entity.cat.purr', 'entity.cat.purreow', 'entity.cat.stray_ambient',
            // Cave Spider
            'entity.cave_spider.ambient', 'entity.cave_spider.death',
            'entity.cave_spider.hurt', 'entity.cave_spider.step',
            // Chicken
            'entity.chicken.ambient', 'entity.chicken.death', 'entity.chicken.egg',
            'entity.chicken.hurt', 'entity.chicken.step',
            // Cod
            'entity.cod.ambient', 'entity.cod.death', 'entity.cod.flop', 'entity.cod.hurt',
            // Cow
            'entity.cow.ambient', 'entity.cow.death', 'entity.cow.hurt',
            'entity.cow.milk', 'entity.cow.step',
            // Creaking (1.21.4)
            'entity.creaking.activate', 'entity.creaking.ambient',
            'entity.creaking.attack', 'entity.creaking.deactivate',
            'entity.creaking.death', 'entity.creaking.freeze', 'entity.creaking.hurt',
            'entity.creaking.step', 'entity.creaking.sway',
            'entity.creaking.unfreeze',
            // Creeper
            'entity.creeper.death', 'entity.creeper.hurt',
            'entity.creeper.primed', 'entity.creeper.death',
            // Dolphin
            'entity.dolphin.ambient', 'entity.dolphin.ambient.water',
            'entity.dolphin.attack', 'entity.dolphin.death', 'entity.dolphin.eat',
            'entity.dolphin.hurt', 'entity.dolphin.jump', 'entity.dolphin.play',
            'entity.dolphin.splash', 'entity.dolphin.swim',
            // Donkey
            'entity.donkey.ambient', 'entity.donkey.angry', 'entity.donkey.chest',
            'entity.donkey.death', 'entity.donkey.eat', 'entity.donkey.hurt',
            'entity.donkey.jump',
            // Dragon Fireball
            'entity.dragon_fireball.explode',
            // Drowned
            'entity.drowned.ambient', 'entity.drowned.ambient_water',
            'entity.drowned.death', 'entity.drowned.death_water',
            'entity.drowned.hurt', 'entity.drowned.hurt_water',
            'entity.drowned.shoot', 'entity.drowned.step', 'entity.drowned.swim',
            // Elder Guardian
            'entity.elder_guardian.ambient', 'entity.elder_guardian.ambient_land',
            'entity.elder_guardian.curse', 'entity.elder_guardian.death',
            'entity.elder_guardian.death_land', 'entity.elder_guardian.flop',
            'entity.elder_guardian.hurt', 'entity.elder_guardian.hurt_land',
            // End Crystal
            'entity.end_crystal.ambient', 'entity.end_crystal.death', 'entity.end_crystal.explode',
            // Ender Dragon
            'entity.ender_dragon.ambient', 'entity.ender_dragon.death',
            'entity.ender_dragon.flap', 'entity.ender_dragon.growl',
            'entity.ender_dragon.hurt', 'entity.ender_dragon.shoot',
            // Ender Eye
            'entity.ender_eye.death', 'entity.ender_eye.launch',
            // Ender Pearl
            'entity.ender_pearl.throw',
            // Enderman/Endermite
            'entity.enderman.ambient', 'entity.enderman.death', 'entity.enderman.hurt',
            'entity.enderman.scream', 'entity.enderman.stare', 'entity.enderman.teleport',
            'entity.endermite.ambient', 'entity.endermite.death', 'entity.endermite.hurt', 'entity.endermite.step',
            // Evoker
            'entity.evoker.ambient', 'entity.evoker.cast_spell',
            'entity.evoker.celebrate', 'entity.evoker.death',
            'entity.evoker.hurt', 'entity.evoker.prepare_attack',
            'entity.evoker.prepare_summon', 'entity.evoker.prepare_wololo',
            // Evoker Fangs
            'entity.evoker_fangs.attack',
            // Experience Orb
            'entity.experience_orb.pickup',
            // Experience Bottle
            'entity.experience_bottle.throw',
            // Eye of Ender
            'entity.ender_eye.launch',
            // Fireball
            'entity.fireball.shoot',
            // Firework
            'entity.firework_rocket.blast', 'entity.firework_rocket.blast_far',
            'entity.firework_rocket.large_blast', 'entity.firework_rocket.large_blast_far',
            'entity.firework_rocket.launch', 'entity.firework_rocket.shoot',
            'entity.firework_rocket.twinkle', 'entity.firework_rocket.twinkle_far',
            // Fishing Bobber
            'entity.fishing_bobber.retrieve', 'entity.fishing_bobber.splash',
            'entity.fishing_bobber.throw',
            // Fox
            'entity.fox.aggro', 'entity.fox.ambient', 'entity.fox.bite',
            'entity.fox.death', 'entity.fox.eat', 'entity.fox.hurt',
            'entity.fox.screech', 'entity.fox.sleep', 'entity.fox.sniff',
            'entity.fox.spit', 'entity.fox.teleport',
            // Frog
            'entity.frog.ambient', 'entity.frog.death', 'entity.frog.eat',
            'entity.frog.hurt', 'entity.frog.lay_spawn', 'entity.frog.long_jump',
            'entity.frog.step', 'entity.frog.tongue',
            // Generic
            'entity.generic.big_fall', 'entity.generic.burn', 'entity.generic.death',
            'entity.generic.drink', 'entity.generic.eat', 'entity.generic.explode',
            'entity.generic.extinguish_fire', 'entity.generic.hurt',
            'entity.generic.small_fall', 'entity.generic.splash',
            'entity.generic.swim', 'entity.generic.wind_burst',
            // Ghast
            'entity.ghast.ambient', 'entity.ghast.death', 'entity.ghast.hurt',
            'entity.ghast.scream', 'entity.ghast.shoot', 'entity.ghast.warn',
            // Glow Squid
            'entity.glow_squid.ambient', 'entity.glow_squid.death',
            'entity.glow_squid.hurt', 'entity.glow_squid.squirt',
            // Goat
            'entity.goat.ambient', 'entity.goat.death', 'entity.goat.eat',
            'entity.goat.hurt', 'entity.goat.long_jump', 'entity.goat.milk',
            'entity.goat.prepare_ram_long_distance', 'entity.goat.prepare_ram_short_distance',
            'entity.goat.ram_impact', 'entity.goat.screaming.ambient',
            'entity.goat.screaming.death', 'entity.goat.screaming.eat',
            'entity.goat.screaming.hurt', 'entity.goat.screaming.milk',
            'entity.goat.screaming.prepare_ram_long_distance',
            'entity.goat.screaming.prepare_ram_short_distance',
            'entity.goat.screaming.ram_impact',
            // Guardian
            'entity.guardian.ambient', 'entity.guardian.ambient_land',
            'entity.guardian.attack', 'entity.guardian.death',
            'entity.guardian.death_land', 'entity.guardian.flop',
            'entity.guardian.hurt', 'entity.guardian.hurt_land',
            // Happy Ghast (1.21.5)
            'entity.happy_ghast.ambient', 'entity.happy_ghast.ambient_scream',
            'entity.happy_ghast.death', 'entity.happy_ghast.equip_goggles',
            'entity.happy_ghast.hurt', 'entity.happy_ghast.steps',
            // Hoglin
            'entity.hoglin.ambient', 'entity.hoglin.angry',
            'entity.hoglin.attack', 'entity.hoglin.converted_to_zoglin',
            'entity.hoglin.death', 'entity.hoglin.hurt',
            'entity.hoglin.retreat', 'entity.hoglin.step',
            // Horse
            'entity.horse.ambient', 'entity.horse.angry', 'entity.horse.armor',
            'entity.horse.breathe', 'entity.horse.death', 'entity.horse.eat',
            'entity.horse.gallop', 'entity.horse.hurt', 'entity.horse.jump',
            'entity.horse.land', 'entity.horse.saddle', 'entity.horse.step',
            'entity.horse.step_wood',
            // Husk
            'entity.husk.ambient', 'entity.husk.converted_to_zombie',
            'entity.husk.death', 'entity.husk.hurt', 'entity.husk.step',
            // Illusioner
            'entity.illusioner.ambient', 'entity.illusioner.cast_spell',
            'entity.illusioner.death', 'entity.illusioner.hurt',
            'entity.illusioner.mirror_move', 'entity.illusioner.prepare_blindness',
            'entity.illusioner.prepare_mirror',
            // Iron Golem
            'entity.iron_golem.attack', 'entity.iron_golem.damage',
            'entity.iron_golem.death', 'entity.iron_golem.hurt',
            'entity.iron_golem.repair', 'entity.iron_golem.step',
            // Item
            'entity.item.break', 'entity.item.pickup',
            // Item Frame
            'entity.item_frame.add_item', 'entity.item_frame.break',
            'entity.item_frame.place', 'entity.item_frame.remove_item',
            'entity.item_frame.rotate_item',
            // Leash Knot
            'entity.leash_knot.break', 'entity.leash_knot.place',
            // Llama
            'entity.llama.ambient', 'entity.llama.angry',
            'entity.llama.chest', 'entity.llama.death', 'entity.llama.eat',
            'entity.llama.hurt', 'entity.llama.spit', 'entity.llama.step',
            'entity.llama.swag',
            // Magma Cube
            'entity.magma_cube.death', 'entity.magma_cube.death_small',
            'entity.magma_cube.hurt', 'entity.magma_cube.hurt_small',
            'entity.magma_cube.jump', 'entity.magma_cube.squish',
            'entity.magma_cube.squish_small',
            // Minecart
            'entity.minecart.inside', 'entity.minecart.inside.underwater',
            'entity.minecart.riding',
            // Mooshroom
            'entity.mooshroom.convert', 'entity.mooshroom.eat',
            'entity.mooshroom.milk', 'entity.mooshroom.shear',
            'entity.mooshroom.suspicious_milk',
            // Mule
            'entity.mule.ambient', 'entity.mule.angry',
            'entity.mule.chest', 'entity.mule.death',
            'entity.mule.eat', 'entity.mule.hurt', 'entity.mule.jump',
            // Ocelot
            'entity.ocelot.ambient', 'entity.ocelot.death', 'entity.ocelot.hurt',
            // Painting
            'entity.painting.break', 'entity.painting.place',
            // Panda
            'entity.panda.aggressive_ambient', 'entity.panda.ambient',
            'entity.panda.bite', 'entity.panda.cant_breed', 'entity.panda.death',
            'entity.panda.eat', 'entity.panda.hurt', 'entity.panda.pre_sneeze',
            'entity.panda.sneeze', 'entity.panda.step',
            'entity.panda.worried_ambient',
            // Parrot
            'entity.parrot.ambient', 'entity.parrot.death',
            'entity.parrot.eat', 'entity.parrot.fly', 'entity.parrot.hurt',
            'entity.parrot.imitate.blaze', 'entity.parrot.imitate.creeper',
            'entity.parrot.imitate.drowned', 'entity.parrot.imitate.elder_guardian',
            'entity.parrot.imitate.endermite', 'entity.parrot.imitate.ender_dragon',
            'entity.parrot.imitate.evocation_illager', 'entity.parrot.imitate.ghast',
            'entity.parrot.imitate.guardian', 'entity.parrot.imitate.hoglin',
            'entity.parrot.imitate.husk', 'entity.parrot.imitate.illusioner',
            'entity.parrot.imitate.magma_cube', 'entity.parrot.imitate.phantom',
            'entity.parrot.imitate.piglin', 'entity.parrot.imitate.piglin_brute',
            'entity.parrot.imitate.pillager', 'entity.parrot.imitate.ravager',
            'entity.parrot.imitate.shulker', 'entity.parrot.imitate.silverfish',
            'entity.parrot.imitate.skeleton', 'entity.parrot.imitate.slime',
            'entity.parrot.imitate.spider', 'entity.parrot.imitate.stray',
            'entity.parrot.imitate.vex', 'entity.parrot.imitate.vindicator',
            'entity.parrot.imitate.warden', 'entity.parrot.imitate.witch',
            'entity.parrot.imitate.wither', 'entity.parrot.imitate.wither_skeleton',
            'entity.parrot.imitate.zoglin', 'entity.parrot.imitate.zombie',
            'entity.parrot.imitate.zombie_villager', 'entity.parrot.step',
            // Phantom
            'entity.phantom.ambient', 'entity.phantom.bite',
            'entity.phantom.death', 'entity.phantom.flap',
            'entity.phantom.hurt', 'entity.phantom.swoop',
            // Pig
            'entity.pig.ambient', 'entity.pig.death',
            'entity.pig.hurt', 'entity.pig.saddle', 'entity.pig.step',
            // Piglin
            'entity.piglin.ambient', 'entity.piglin.angry',
            'entity.piglin.celebrate', 'entity.piglin.converted_to_zombified',
            'entity.piglin.death', 'entity.piglin.hurt',
            'entity.piglin.jealous', 'entity.piglin.retreat',
            'entity.piglin.step',
            'entity.piglin_brute.ambient', 'entity.piglin_brute.angry',
            'entity.piglin_brute.converted_to_zombified', 'entity.piglin_brute.death',
            'entity.piglin_brute.hurt', 'entity.piglin_brute.step',
            // Pillager
            'entity.pillager.ambient', 'entity.pillager.celebrate',
            'entity.pillager.death', 'entity.pillager.hurt',
            // Player
            'entity.player.attack.crit', 'entity.player.attack.knockback',
            'entity.player.attack.nodamage', 'entity.player.attack.strong',
            'entity.player.attack.sweep', 'entity.player.attack.weak',
            'entity.player.big_fall', 'entity.player.breath',
            'entity.player.burp', 'entity.player.death',
            'entity.player.hurt', 'entity.player.hurt_drown',
            'entity.player.hurt_freeze', 'entity.player.hurt_on_fire',
            'entity.player.hurt_sweet_berry_bush', 'entity.player.levelup',
            'entity.player.small_fall', 'entity.player.splash',
            'entity.player.splash.high_speed', 'entity.player.swim',
            // Polar Bear
            'entity.polar_bear.ambient', 'entity.polar_bear.ambient_baby',
            'entity.polar_bear.death', 'entity.polar_bear.hurt', 'entity.polar_bear.step',
            'entity.polar_bear.warning',
            // Pufferfish
            'entity.puffer_fish.ambient', 'entity.puffer_fish.blow_out',
            'entity.puffer_fish.blow_up', 'entity.puffer_fish.death',
            'entity.puffer_fish.flop', 'entity.puffer_fish.hurt',
            'entity.puffer_fish.sting',
            // Rabbit
            'entity.rabbit.ambient', 'entity.rabbit.attack',
            'entity.rabbit.death', 'entity.rabbit.hurt',
            'entity.rabbit.jump', 'entity.rabbit.squeak',
            // Ravager
            'entity.ravager.ambient', 'entity.ravager.attack',
            'entity.ravager.celebrate', 'entity.ravager.death',
            'entity.ravager.hurt', 'entity.ravager.roar',
            'entity.ravager.step', 'entity.ravager.stunned',
            // Salmon
            'entity.salmon.ambient', 'entity.salmon.death',
            'entity.salmon.flop', 'entity.salmon.hurt',
            // Sheep
            'entity.sheep.ambient', 'entity.sheep.death',
            'entity.sheep.hurt', 'entity.sheep.shear', 'entity.sheep.step',
            // Shulker
            'entity.shulker.ambient', 'entity.shulker.close',
            'entity.shulker.death', 'entity.shulker.hurt',
            'entity.shulker.hurt_closed', 'entity.shulker.open',
            'entity.shulker.shoot', 'entity.shulker.teleport',
            'entity.shulker_bullet.hit', 'entity.shulker_bullet.hurt',
            // Silverfish
            'entity.silverfish.ambient', 'entity.silverfish.death',
            'entity.silverfish.hurt', 'entity.silverfish.step',
            // Skeleton
            'entity.skeleton.ambient', 'entity.skeleton.death',
            'entity.skeleton.hurt', 'entity.skeleton.shoot',
            'entity.skeleton.step',
            'entity.skeleton_horse.ambient', 'entity.skeleton_horse.ambient_water',
            'entity.skeleton_horse.death', 'entity.skeleton_horse.gallop_water',
            'entity.skeleton_horse.hurt', 'entity.skeleton_horse.jump_water',
            'entity.skeleton_horse.step_water', 'entity.skeleton_horse.swim',
            // Slime
            'entity.slime.attack', 'entity.slime.death', 'entity.slime.death_small',
            'entity.slime.hurt', 'entity.slime.hurt_small',
            'entity.slime.jump', 'entity.slime.jump_small',
            'entity.slime.squish', 'entity.slime.squish_small',
            // Sniffer
            'entity.sniffer.ambient', 'entity.sniffer.death',
            'entity.sniffer.digging', 'entity.sniffer.digging_stop',
            'entity.sniffer.drop_seed', 'entity.sniffer.eat',
            'entity.sniffer.happy', 'entity.sniffer.hurt',
            'entity.sniffer.idle', 'entity.sniffer.scenting',
            'entity.sniffer.searching', 'entity.sniffer.sniffing',
            'entity.sniffer.step',
            // Snow Golem
            'entity.snow_golem.ambient', 'entity.snow_golem.death',
            'entity.snow_golem.hurt', 'entity.snow_golem.shear',
            'entity.snow_golem.shoot',
            // Snowball
            'entity.snowball.throw',
            // Spider
            'entity.spider.ambient', 'entity.spider.death',
            'entity.spider.hurt', 'entity.spider.step',
            // Splash Potion
            'entity.splash_potion.break', 'entity.splash_potion.throw',
            // Squid
            'entity.squid.ambient', 'entity.squid.death',
            'entity.squid.hurt', 'entity.squid.squirt',
            // Stray
            'entity.stray.ambient', 'entity.stray.death',
            'entity.stray.hurt', 'entity.stray.step',
            // Strider
            'entity.strider.ambient', 'entity.strider.death',
            'entity.strider.eat', 'entity.strider.happy',
            'entity.strider.hurt', 'entity.strider.retreat',
            'entity.strider.saddle', 'entity.strider.step',
            'entity.strider.step_lava',
            // Tadpole
            'entity.tadpole.death', 'entity.tadpole.flop',
            'entity.tadpole.grow_up', 'entity.tadpole.hurt',
            // TNT
            'entity.tnt.primed',
            // Trident
            'entity.trident.hit', 'entity.trident.hit_ground',
            'entity.trident.return', 'entity.trident.riptide_1',
            'entity.trident.riptide_2', 'entity.trident.riptide_3',
            'entity.trident.throw', 'entity.trident.thunder',
            // Tropical Fish
            'entity.tropical_fish.ambient', 'entity.tropical_fish.death',
            'entity.tropical_fish.flop', 'entity.tropical_fish.hurt',
            // Turtle
            'entity.turtle.ambient_land', 'entity.turtle.death',
            'entity.turtle.death_baby', 'entity.turtle.egg_break',
            'entity.turtle.egg_crack', 'entity.turtle.egg_hatch',
            'entity.turtle.hurt', 'entity.turtle.hurt_baby',
            'entity.turtle.lay_egg', 'entity.turtle.shamble',
            'entity.turtle.shamble_baby', 'entity.turtle.swim',
            // Vex
            'entity.vex.ambient', 'entity.vex.charge',
            'entity.vex.death', 'entity.vex.hurt',
            // Villager
            'entity.villager.ambient', 'entity.villager.celebrate',
            'entity.villager.death', 'entity.villager.hurt',
            'entity.villager.no', 'entity.villager.trade',
            'entity.villager.work_armorer', 'entity.villager.work_butcher',
            'entity.villager.work_cartographer', 'entity.villager.work_cleric',
            'entity.villager.work_farmer', 'entity.villager.work_fisherman',
            'entity.villager.work_fletcher', 'entity.villager.work_leatherworker',
            'entity.villager.work_librarian', 'entity.villager.work_mason',
            'entity.villager.work_nitwit', 'entity.villager.work_shepherd',
            'entity.villager.work_toolsmith', 'entity.villager.work_weaponsmith',
            'entity.villager.yes',
            // Vindicator
            'entity.vindicator.ambient', 'entity.vindicator.celebrate',
            'entity.vindicator.death', 'entity.vindicator.hurt',
            // Warden
            'entity.warden.agitated', 'entity.warden.ambient',
            'entity.warden.angry', 'entity.warden.attack_impact',
            'entity.warden.death', 'entity.warden.dig',
            'entity.warden.emerge', 'entity.warden.heartbeat',
            'entity.warden.hurt', 'entity.warden.listening',
            'entity.warden.listening_angry', 'entity.warden.nearby_close',
            'entity.warden.nearby_closer', 'entity.warden.nearby_closest',
            'entity.warden.roar', 'entity.warden.sniff',
            'entity.warden.sonic_boom', 'entity.warden.sonic_charge',
            'entity.warden.step', 'entity.warden.tendril_clicks',
            // Witch
            'entity.witch.ambient', 'entity.witch.celebrate',
            'entity.witch.death', 'entity.witch.drink',
            'entity.witch.hurt', 'entity.witch.throw',
            // Wither
            'entity.wither.ambient', 'entity.wither.break_block',
            'entity.wither.death', 'entity.wither.hurt',
            'entity.wither.shoot', 'entity.wither.spawn',
            'entity.wither_skeleton.ambient', 'entity.wither_skeleton.death',
            'entity.wither_skeleton.hurt', 'entity.wither_skeleton.step',
            // Wolf
            'entity.wolf.ambient', 'entity.wolf.death',
            'entity.wolf.growl', 'entity.wolf.howl',
            'entity.wolf.hurt', 'entity.wolf.pant',
            'entity.wolf.shake', 'entity.wolf.step', 'entity.wolf.whine',
            'entity.wolf.armor.break', 'entity.wolf.armor.crack', 'entity.wolf.armor.repair',
            // Wind Charge (1.21)
            'entity.wind_charge.throw', 'entity.wind_charge.wind_burst',
            // Zoglin
            'entity.zoglin.ambient', 'entity.zoglin.angry',
            'entity.zoglin.attack', 'entity.zoglin.death',
            'entity.zoglin.hurt', 'entity.zoglin.step',
            // Zombie
            'entity.zombie.ambient', 'entity.zombie.attack_iron_door',
            'entity.zombie.attack_wooden_door', 'entity.zombie.break_wooden_door',
            'entity.zombie.converted_to_drowned', 'entity.zombie.death',
            'entity.zombie.destroy_egg', 'entity.zombie.hurt',
            'entity.zombie.infect', 'entity.zombie.step',
            'entity.zombie_horse.ambient', 'entity.zombie_horse.death', 'entity.zombie_horse.hurt',
            'entity.zombie_villager.ambient', 'entity.zombie_villager.converted',
            'entity.zombie_villager.cure', 'entity.zombie_villager.death',
            'entity.zombie_villager.hurt', 'entity.zombie_villager.step',
            // Zombified Piglin
            'entity.zombified_piglin.ambient', 'entity.zombified_piglin.angry',
            'entity.zombified_piglin.death', 'entity.zombified_piglin.hurt',
        ]
    },

    // ═══════════════════════════════════════════════════════════
    // EVENT
    // ═══════════════════════════════════════════════════════════
    event: {
        label: 'Event',
        color: '#f59e0b',
        icon: '⚡',
        sounds: [
            'event.mob_effect.bad_omen',
            'event.mob_effect.raid_omen',
            'event.mob_effect.trial_omen',
            'event.raid.horn',
        ]
    },

    // ═══════════════════════════════════════════════════════════
    // ITEM
    // ═══════════════════════════════════════════════════════════
    item: {
        label: 'Item',
        color: '#10b981',
        icon: '📦',
        sounds: [
            'item.armor.equip_chain', 'item.armor.equip_diamond',
            'item.armor.equip_elytra', 'item.armor.equip_generic',
            'item.armor.equip_gold', 'item.armor.equip_iron',
            'item.armor.equip_leather', 'item.armor.equip_netherite',
            'item.armor.equip_turtle',
            'item.armor.equip_wolf',
            'item.axe.scrape', 'item.axe.strip', 'item.axe.wax_off',
            'item.bone_meal.use',
            'item.book.page_turn', 'item.book.put',
            'item.bottle.empty', 'item.bottle.fill', 'item.bottle.fill_dragonbreath',
            'item.bucket.empty', 'item.bucket.empty_axolotl',
            'item.bucket.empty_fish', 'item.bucket.empty_lava',
            'item.bucket.empty_powder_snow', 'item.bucket.empty_tadpole',
            'item.bucket.fill', 'item.bucket.fill_axolotl',
            'item.bucket.fill_fish', 'item.bucket.fill_lava',
            'item.bucket.fill_powder_snow', 'item.bucket.fill_tadpole',
            'item.bundle.insert', 'item.bundle.insert_fail', 'item.bundle.remove_one',
            'item.crop.plant',
            'item.crossbow.hit', 'item.crossbow.loading_end',
            'item.crossbow.loading_middle', 'item.crossbow.loading_start',
            'item.crossbow.quick_charge_1', 'item.crossbow.quick_charge_2',
            'item.crossbow.quick_charge_3', 'item.crossbow.shoot',
            'item.elytra.flying',
            'item.firecharge.use',
            'item.flintandsteel.use',
            'item.glow_ink_sac.use',
            'item.goat_horn.sound.0', 'item.goat_horn.sound.1', 'item.goat_horn.sound.2',
            'item.goat_horn.sound.3', 'item.goat_horn.sound.4', 'item.goat_horn.sound.5',
            'item.goat_horn.sound.6', 'item.goat_horn.sound.7',
            'item.hoe.till',
            'item.honey_bottle.drink',
            'item.honeycomb.wax_on',
            'item.ink_sac.use',
            'item.lodestone_compass.lock',
            'item.mace.smash_air', 'item.mace.smash_ground',
            'item.mace.smash_ground_heavy',
            'item.nether_wart.plant',
            'item.ominous_bottle.dispose',
            'item.shield.block', 'item.shield.break',
            'item.shovel.flatten',
            'item.spyglass.stop_using', 'item.spyglass.use',
            'item.totem.use',
            'item.trident.hit', 'item.trident.hit_ground',
            'item.trident.return', 'item.trident.riptide_1',
            'item.trident.riptide_2', 'item.trident.riptide_3',
            'item.trident.throw', 'item.trident.thunder',
        ]
    },

    // ═══════════════════════════════════════════════════════════
    // MUSIC
    // ═══════════════════════════════════════════════════════════
    music: {
        label: 'Music',
        color: '#ec4899',
        icon: '🎵',
        sounds: [
            'music.creative', 'music.credits',
            'music.dragon', 'music.end', 'music.end.chaos',
            'music.end.credits', 'music.end.dragon_fight',
            'music.game', 'music.game.below_layers',
            'music.game.calm', 'music.game.creative',
            'music.game.credits', 'music.game.deep_dark',
            'music.game.dragon', 'music.game.end',
            'music.game.endboss', 'music.game.hal1', 'music.game.hal2',
            'music.game.hal3', 'music.game.hal4',
            'music.game.nether_basalt_deltas', 'music.game.nether_cliffs',
            'music.game.nether_nether_wastes',
            'music.game.nether_soul_sand_valley',
            'music.game.nether_warped_forest',
            'music.game.nuance1', 'music.game.nuance2',
            'music.game.piano1', 'music.game.piano2', 'music.game.piano3',
            'music.game.update', 'music.game.water',
            'music.menu',
            'music.nether.basalt_deltas', 'music.nether.crimson_forest',
            'music.nether.nether_wastes', 'music.nether.soul_sand_valley',
            'music.nether.warped_forest',
            'music.overworld.bamboo_jungle', 'music.overworld.badlands',
            'music.overworld.cherry_grove', 'music.overworld.deep_dark',
            'music.overworld.desert', 'music.overworld.dripstone_caves',
            'music.overworld.flower_forest', 'music.overworld.forest',
            'music.overworld.frozen_peaks', 'music.overworld.grove',
            'music.overworld.jagged_peaks', 'music.overworld.jungle',
            'music.overworld.lush_caves', 'music.overworld.meadow',
            'music.overworld.old_growth_taiga', 'music.overworld.snowy_slopes',
            'music.overworld.sparse_jungle', 'music.overworld.stony_peaks',
            'music.overworld.swamp', 'music.overworld.deep_dark',
            'music_disc.11', 'music_disc.13',
            'music_disc.5', 'music_disc.blocks',
            'music_disc.cat', 'music_disc.chirp',
            'music_disc.creator', 'music_disc.creator_music_box',
            'music_disc.far', 'music_disc.mall',
            'music_disc.mellohi', 'music_disc.otherside',
            'music_disc.pigstep', 'music_disc.precipice',
            'music_disc.relic', 'music_disc.stal',
            'music_disc.strad', 'music_disc.wait',
            'music_disc.ward',
        ]
    },

    // ═══════════════════════════════════════════════════════════
    // PARTICLE
    // ═══════════════════════════════════════════════════════════
    particle: {
        label: 'Particle',
        color: '#3b82f6',
        icon: '✨',
        sounds: [
            'particle.soul_escape',
        ]
    },

    // ═══════════════════════════════════════════════════════════
    // UI
    // ═══════════════════════════════════════════════════════════
    ui: {
        label: 'UI',
        color: '#6b7280',
        icon: '🖥️',
        sounds: [
            'ui.button.click',
            'ui.cartography_table.take_result',
            'ui.loom.select_pattern', 'ui.loom.take_result',
            'ui.stonecutter.select_recipe', 'ui.stonecutter.take_result',
            'ui.toast.challenge_complete', 'ui.toast.in', 'ui.toast.out',
        ]
    },

    // ═══════════════════════════════════════════════════════════
    // WEATHER
    // ═══════════════════════════════════════════════════════════
    weather: {
        label: 'Weather',
        color: '#0ea5e9',
        icon: '⛈️',
        sounds: [
            'weather.rain', 'weather.rain.above',
        ]
    },
};

/**
 * Flattened array of all sounds for fast searching
 */
const MINECRAFT_SOUNDS_FLAT = (() => {
    const all = [];
    for (const [, category] of Object.entries(MINECRAFT_SOUNDS)) {
        for (const sound of category.sounds) {
            all.push(sound);
        }
    }
    return all;
})();

/**
 * Map from sound string → category info for display
 */
const MINECRAFT_SOUND_CATEGORY_MAP = (() => {
    const map = {};
    for (const [key, category] of Object.entries(MINECRAFT_SOUNDS)) {
        for (const sound of category.sounds) {
            map[sound] = { key, label: category.label, color: category.color, icon: category.icon };
        }
    }
    return map;
})();

// Export to window for use in mechanicBrowser.js
window.MINECRAFT_SOUNDS = MINECRAFT_SOUNDS;
window.MINECRAFT_SOUNDS_FLAT = MINECRAFT_SOUNDS_FLAT;
window.MINECRAFT_SOUND_CATEGORY_MAP = MINECRAFT_SOUND_CATEGORY_MAP;
