/**
 * MythicMobs Placeholders Data
 * Complete database of all placeholders available in MythicMobs
 * Based on official MythicMobs documentation
 * https://git.mythiccraft.io/mythiccraft/MythicMobs/-/wikis/Skills/Placeholders
 */

const PLACEHOLDERS_DATA = {
    // Categories for organization
    categories: {
        special: { name: 'Special Characters', icon: 'fas fa-keyboard', color: '#6366f1' },
        caster: { name: 'Caster', icon: 'fas fa-skull', color: '#ef4444' },
        target: { name: 'Target', icon: 'fas fa-crosshairs', color: '#10b981' },
        trigger: { name: 'Trigger', icon: 'fas fa-bolt', color: '#f59e0b' },
        misc: { name: 'Misc / Utility', icon: 'fas fa-wrench', color: '#8b5cf6' },
        item: { name: 'Item', icon: 'fas fa-gem', color: '#ec4899' },
        score: { name: 'Scoreboard', icon: 'fas fa-trophy', color: '#14b8a6' },
        variable: { name: 'Variables', icon: 'fas fa-database', color: '#3b82f6' },
        skill: { name: 'Skill Variables', icon: 'fas fa-magic', color: '#f97316' },
        color: { name: 'Color Codes', icon: 'fas fa-palette', color: '#a855f7' },
        papi: { name: 'PlaceholderAPI', icon: 'fas fa-plug', color: '#22c55e' }
    },

    // Special Characters
    special: [
        { placeholder: '<&co>', description: 'Returns a colon', output: ':', example: 'message{m="Time<&co> 12:00"}' },
        { placeholder: '<&sq>', description: 'Returns an apostrophe', output: "'", example: 'message{m="Player<&sq>s Item"}' },
        { placeholder: '<&da>', description: 'Returns a dash', output: '-', example: 'message{m="HP<&da>100"}' },
        { placeholder: '<&bs>', description: 'Returns a backslash', output: '\\', example: 'message{m="Path<&bs>file"}' },
        { placeholder: '<&fs>', description: 'Returns a forward slash', output: '/', example: 'message{m="A<&fs>B"}' },
        { placeholder: '<&sp>', description: 'Returns a space', output: ' ', example: 'message{m="Hello<&sp>World"}' },
        { placeholder: '<&cm>', description: 'Returns a comma', output: ',', example: 'message{m="A<&cm>B<&cm>C"}' },
        { placeholder: '<&sc>', description: 'Returns a semicolon', output: ';', example: 'message{m="A<&sc>B"}' },
        { placeholder: '<&eq>', description: 'Returns an equals symbol', output: '=', example: 'message{m="X<&eq>5"}' },
        { placeholder: '<&dq>', description: 'Returns double quotes', output: '"', example: 'message{m=<&dq>Hello<&dq>}' },
        { placeholder: '<&rb>', description: 'Returns a right bracket', output: ']', example: 'message{m="[text<&rb>"}' },
        { placeholder: '<&lb>', description: 'Returns a left bracket', output: '[', example: 'message{m="<&lb>text]"}' },
        { placeholder: '<&rc>', description: 'Returns a right curly bracket', output: '}', example: 'message{m="{text<&rc>"}' },
        { placeholder: '<&lc>', description: 'Returns a left curly bracket', output: '{', example: 'message{m="<&lc>text}"}' },
        { placeholder: '<&nm>', description: 'Returns a number sign', output: '#', example: 'message{m="<&nm>1"}' },
        { placeholder: '<&nl>', description: 'Forces a new line', output: '\\n', example: 'message{m="Line1<&nl>Line2"}' },
        { placeholder: '<&heart>', description: 'Returns a heart symbol', output: '❤', example: 'message{m="<&heart> Health"}' },
        { placeholder: '<&skull>', description: 'Returns a skull symbol', output: '☠', example: 'message{m="<&skull> Death"}' },
        { placeholder: '<&lt>', description: 'Returns less than symbol', output: '<', example: 'message{m="A<&lt>B"}' },
        { placeholder: '<&gt>', description: 'Returns greater than symbol', output: '>', example: 'message{m="A<&gt>B"}' },
        { placeholder: '<^dot>', description: 'Returns a dot', output: '.', example: 'message{m="1<^dot>0"}' },
        { placeholder: '<^dot2>', description: 'Returns the placeholder for dot (nested)', output: '<^dot>', example: 'For sensitive parsing' }
    ],

    // Caster Placeholders
    caster: [
        { placeholder: '<caster.damage>', description: 'Returns the caster\'s Attack_Damage attribute value', example: 'message{m="Damage: <caster.damage>"}' },
        { placeholder: '<caster.display>', description: 'Returns the caster\'s displayed name', example: 'message{m="<caster.display> attacks!"}' },
        { placeholder: '<caster.mythic_type>', description: 'Returns the caster\'s internal mob type', example: 'message{m="Type: <caster.mythic_type>"}' },
        { placeholder: '<caster.type>', description: 'Returns the internal id of a MythicMob or entity name', example: 'condition{c="<caster.type> == ZOMBIE"}' },
        { placeholder: '<caster.type.name>', description: 'Returns the display name of MythicMob or entity', example: 'message{m="<caster.type.name>"}' },
        { placeholder: '<caster.uuid>', description: 'Returns the UUID of the caster', example: 'setvariable{var=uuid;val=<caster.uuid>}' },
        { placeholder: '<caster.level>', description: 'Returns the level of the caster', example: 'message{m="Level <caster.level> Boss"}' },
        { placeholder: '<caster.name>', description: 'Returns the name of the caster', example: 'message{m="<caster.name> spawned!"}' },
        { placeholder: '<caster.hp>', description: 'Returns current HP of the caster', example: 'message{m="HP: <caster.hp>"}' },
        { placeholder: '<caster.mhp>', description: 'Returns the max HP of the caster', example: 'message{m="Max HP: <caster.mhp>"}' },
        { placeholder: '<caster.php>', description: 'Returns the percent HP of the caster (0-100)', example: 'message{m="<caster.php>% HP"}' },
        { placeholder: '<caster.thp>', description: 'Returns the full number HP of the caster', example: 'message{m="Total HP: <caster.thp>"}' },
        { placeholder: '<caster.tt.top>', description: 'Returns the name of top threat holder', example: 'message{m="Top threat: <caster.tt.top>"}', premium: true },
        { placeholder: '<caster.l.w>', description: 'Returns the world name the caster is in', example: 'condition{c="<caster.l.w> == world"}' },
        { placeholder: '<caster.l.x>', description: 'Returns the X coordinate of the caster', example: 'message{m="X: <caster.l.x>"}' },
        { placeholder: '<caster.l.x.#>', description: 'Returns X coordinate +/- random float', example: '<caster.l.x.5> (X +/- 0-5)' },
        { placeholder: '<caster.l.x.double>', description: 'Returns the precise X coordinate', example: 'setvariable{var=x;val=<caster.l.x.double>}' },
        { placeholder: '<caster.l.y>', description: 'Returns the Y coordinate of the caster', example: 'message{m="Y: <caster.l.y>"}' },
        { placeholder: '<caster.l.y.#>', description: 'Returns Y coordinate +/- random float', example: '<caster.l.y.2> (Y +/- 0-2)' },
        { placeholder: '<caster.l.y.double>', description: 'Returns the precise Y coordinate', example: 'setvariable{var=y;val=<caster.l.y.double>}' },
        { placeholder: '<caster.l.z>', description: 'Returns the Z coordinate of the caster', example: 'message{m="Z: <caster.l.z>"}' },
        { placeholder: '<caster.l.z.#>', description: 'Returns Z coordinate +/- random float', example: '<caster.l.z.3> (Z +/- 0-3)' },
        { placeholder: '<caster.l.z.double>', description: 'Returns the precise Z coordinate', example: 'setvariable{var=z;val=<caster.l.z.double>}' },
        { placeholder: '<caster.l.yaw>', description: 'Returns the yaw (rotation) of the caster', example: 'message{m="Yaw: <caster.l.yaw>"}' },
        { placeholder: '<caster.l.pitch>', description: 'Returns the pitch of the caster', example: 'message{m="Pitch: <caster.l.pitch>"}' },
        { placeholder: '<caster.stance>', description: 'Returns the current stance of the caster', example: 'condition{c="<caster.stance> == aggressive"}' },
        { placeholder: '<caster.stat.{Stat}>', description: 'Returns value of specified stat on caster', example: '<caster.stat.STRENGTH>', premium: true },
        { placeholder: '<caster.heldenchantlevel.{ID}>', description: 'Returns enchant level of specified enchant', example: '<caster.heldenchantlevel.16> (Sharpness)' },
        { placeholder: '<caster.skill.{Skill}.cooldown>', description: 'Returns cooldown of a skill as float', example: '<caster.skill.Fireball.cooldown>' },
        { placeholder: '<caster.raytrace>', description: 'Returns block being looked at (4.5 range)', example: 'message{m="Looking at: <caster.raytrace>"}' },
        { placeholder: '<caster.raytrace.#>', description: 'Returns block being looked at within range', example: '<caster.raytrace.10> (10 block range)' },
        { placeholder: '<caster.children.size>', description: 'Returns the number of children this entity has', example: 'message{m="Minions: <caster.children.size>"}' },
        { placeholder: '<caster.attack_cooldown>', description: 'Returns attack cooldown (0-1 float)', example: 'condition{c="<caster.attack_cooldown> >= 1"}' }
    ],

    // Target Placeholders
    target: [
        { placeholder: '<target.uuid>', description: 'Returns the UUID of the target', example: 'setvariable{var=targetUUID;val=<target.uuid>}' },
        { placeholder: '<target.name>', description: 'Returns the name of the target', example: 'message{m="Targeting <target.name>"}' },
        { placeholder: '<target.hp>', description: 'Returns current HP of the target', example: 'message{m="<target.name>: <target.hp> HP"}' },
        { placeholder: '<target.mhp>', description: 'Returns the max HP of the target', example: 'message{m="Max: <target.mhp>"}' },
        { placeholder: '<target.php>', description: 'Returns the percent HP of the target', example: 'message{m="<target.php>% remaining"}' },
        { placeholder: '<target.thp>', description: 'Returns the full number HP of target', example: 'message{m="<target.thp> total HP"}' },
        { placeholder: '<target.threat>', description: 'Returns the threat level of the target', example: 'message{m="Threat: <target.threat>"}', premium: true },
        { placeholder: '<target.l.w>', description: 'Returns the world name the target is in', example: 'condition{c="<target.l.w> == world"}' },
        { placeholder: '<target.l.x>', description: 'Returns the X coordinate of the target', example: 'teleport{coords=<target.l.x>,<target.l.y>,<target.l.z>}' },
        { placeholder: '<target.l.x.#>', description: 'Returns X coordinate +/- random float', example: '<target.l.x.2>' },
        { placeholder: '<target.l.y>', description: 'Returns the Y coordinate of the target', example: 'summon{type=ZOMBIE;y=<target.l.y>}' },
        { placeholder: '<target.l.y.#>', description: 'Returns Y coordinate +/- random float', example: '<target.l.y.1>' },
        { placeholder: '<target.l.z>', description: 'Returns the Z coordinate of the target', example: 'particle{p=flame;x=<target.l.x>;z=<target.l.z>}' },
        { placeholder: '<target.l.z.#>', description: 'Returns Z coordinate +/- random float', example: '<target.l.z.3>' },
        { placeholder: '<target.l.yaw>', description: 'Returns the yaw of the target', example: 'setvariable{var=yaw;val=<target.l.yaw>}' },
        { placeholder: '<target.l.pitch>', description: 'Returns the pitch of the target', example: 'setvariable{var=pitch;val=<target.l.pitch>}' },
        { placeholder: '<target.level>', description: 'Returns the level of the target', example: 'message{m="Target Level: <target.level>"}' },
        { placeholder: '<target.block.type>', description: 'Returns the block type at target location', example: 'condition{c="<target.block.type> == STONE"}' },
        { placeholder: '<target.block.data>', description: 'Returns the block data of target block', example: 'setvariable{var=data;val=<target.block.data>}' },
        { placeholder: '<target.entity_type>', description: 'Returns the entity type of the target', example: 'condition{c="<target.entity_type> == PLAYER"}' },
        { placeholder: '<target.item.type>', description: 'Returns the type of targeted item entity', example: 'condition{c="<target.item.type> == DIAMOND"}' },
        { placeholder: '<target.held.item>', description: 'Returns the item held by the target', example: 'message{m="Holding: <target.held.item>"}' },
        { placeholder: '<target.itemstack_amount>', description: 'Returns amount of item entities on ground', example: 'message{m="<target.itemstack_amount> items"}' },
        { placeholder: '<target.stat.{Stat}>', description: 'Returns value of specified stat on target', example: '<target.stat.DEFENSE>', premium: true },
        { placeholder: '<target.raytrace>', description: 'Returns block being looked at by target', example: 'message{m="Target sees: <target.raytrace>"}' },
        { placeholder: '<target.raytrace.#>', description: 'Returns block within specified range', example: '<target.raytrace.20>' },
        { placeholder: '<target.fovoffset>', description: 'Returns angular offset from caster view to target', example: '<target.fovoffset{rotation=0;absolute=true}>' },
        { placeholder: '<target.distance>', description: 'Returns distance between caster and target', example: 'message{m="Distance: <target.distance>"}' },
        { placeholder: '<target.distancesquared>', description: 'Returns squared distance (faster)', example: 'condition{c="<target.distancesquared> < 100"}' },
        { placeholder: '<target.armor>', description: 'Returns the target\'s armor value', example: 'message{m="Armor: <target.armor>"}' },
        { placeholder: '<target.item.itemstack.{Slot}>', description: 'Returns ItemStack in equipment slot', example: '<target.item.itemstack.HAND>' }
    ],

    // Trigger Placeholders
    trigger: [
        { placeholder: '<trigger.uuid>', description: 'Returns the UUID of the trigger entity', example: 'setvariable{var=killerUUID;val=<trigger.uuid>}' },
        { placeholder: '<trigger.name>', description: 'Returns the name of the trigger entity', example: 'message{m="Killed by <trigger.name>"} ~onDeath' },
        { placeholder: '<trigger.hp>', description: 'Returns current HP of the trigger', example: 'message{m="<trigger.name> has <trigger.hp> HP"}' },
        { placeholder: '<trigger.mhp>', description: 'Returns the max HP of the trigger', example: 'message{m="Max HP: <trigger.mhp>"}' },
        { placeholder: '<trigger.threat>', description: 'Returns threat level of trigger', example: 'message{m="Threat: <trigger.threat>"}', premium: true },
        { placeholder: '<trigger.l.w>', description: 'Returns the world name of trigger', example: 'condition{c="<trigger.l.w> == nether"}' },
        { placeholder: '<trigger.l.x>', description: 'Returns the X coordinate of trigger', example: 'teleport{coords=<trigger.l.x>,<trigger.l.y>,<trigger.l.z>}' },
        { placeholder: '<trigger.l.x.#>', description: 'Returns X coordinate +/- random float', example: '<trigger.l.x.5>' },
        { placeholder: '<trigger.l.y>', description: 'Returns the Y coordinate of trigger', example: 'particle{y=<trigger.l.y>}' },
        { placeholder: '<trigger.l.y.#>', description: 'Returns Y coordinate +/- random float', example: '<trigger.l.y.2>' },
        { placeholder: '<trigger.l.z>', description: 'Returns the Z coordinate of trigger', example: 'setblock{z=<trigger.l.z>}' },
        { placeholder: '<trigger.l.z.#>', description: 'Returns Z coordinate +/- random float', example: '<trigger.l.z.3>' },
        { placeholder: '<trigger.l.yaw>', description: 'Returns the yaw of the trigger', example: 'setvariable{var=yaw;val=<trigger.l.yaw>}' },
        { placeholder: '<trigger.l.pitch>', description: 'Returns the pitch of the trigger', example: 'setvariable{var=pitch;val=<trigger.l.pitch>}' },
        { placeholder: '<trigger.held.item>', description: 'Returns the item held by trigger', example: 'message{m="Used: <trigger.held.item>"}' },
        { placeholder: '<trigger.raytrace>', description: 'Returns block being looked at (4.5 range)', example: 'message{m="Looking: <trigger.raytrace>"}' },
        { placeholder: '<trigger.raytrace.#>', description: 'Returns block within specified range', example: '<trigger.raytrace.15>' },
        { placeholder: '<trigger.item.amount>', description: 'Returns amount of item trigger holds', example: 'message{m="Amount: <trigger.item.amount>"}' },
        { placeholder: '<trigger.item.type>', description: 'Returns type of item trigger holds', example: 'condition{c="<trigger.item.type> == BOW"}' },
        { placeholder: '<trigger.item.model>', description: 'Returns model of item trigger holds', example: 'condition{c="<trigger.item.model> == 1001"}' },
        { placeholder: '<trigger.stat.{Stat}>', description: 'Returns value of stat on trigger', example: '<trigger.stat.LUCK>', premium: true },
        { placeholder: '<trigger.distance>', description: 'Returns distance between caster and trigger', example: 'message{m="Distance: <trigger.distance>"}' },
        { placeholder: '<trigger.distancesquared>', description: 'Returns squared distance (faster)', example: 'condition{c="<trigger.distancesquared> < 25"}' }
    ],

    // Misc Placeholders
    misc: [
        { placeholder: '<drop.amount>', description: 'Returns the amount dropped (in drop types)', example: 'Used in drop configurations' },
        { placeholder: '<drops.xp>', description: 'Returns the XP dropped', example: 'message{m="XP: <drops.xp>"}' },
        { placeholder: '<drops.money>', description: 'Returns money dropped (Vault required)', example: 'message{m="$<drops.money>"}', requires: 'Vault' },
        { placeholder: '<random.#to#>', description: 'Returns random integer in range', example: '<random.1to10> (1-10)' },
        { placeholder: '<random.float.#to#>', description: 'Returns random float in range', example: '<random.float.0to1> (0.0-1.0)' },
        { placeholder: '<utils.epoch>', description: 'Returns the current epoch timestamp', example: 'setvariable{var=time;val=<utils.epoch>}' },
        { placeholder: '<utils.epoch.seconds>', description: 'Returns current epoch in seconds', example: 'setvariable{var=sec;val=<utils.epoch.seconds>}' },
        { placeholder: '<utils.epoch.timestamp>', description: 'Returns milliseconds since epoch', example: 'setvariable{var=ms;val=<utils.epoch.timestamp>}' },
        { placeholder: '<utils.epoch.millis>', description: 'Returns current epoch milliseconds', example: 'setvariable{var=millis;val=<utils.epoch.millis>}' },
        { placeholder: '<utils.epoch.ticks>', description: 'Returns current epoch in ticks', example: 'setvariable{var=ticks;val=<utils.epoch.ticks>}' },
        { placeholder: '<skill.power>', description: 'Returns the power of the current metaskill', example: 'damage{a=<skill.power>*10}' },
        { placeholder: '<skill.targets>', description: 'Returns the amount of inherited targets', example: 'message{m="Targets: <skill.targets>"}' },
        { placeholder: '<centertext>', description: 'NEW 5.11.0: Experimental placeholder for centering text in chat/messages', example: 'message{m="<centertext>Centered!"}', experimental: true }
    ],

    // Item Placeholders
    item: [
        { placeholder: '<item.amount>', description: 'Returns amount of item that triggered skill', example: 'message{m="Amount: <item.amount>"}' },
        { placeholder: '<mythicitem.{Item}.material>', description: 'Returns material of MythicItem', example: '<mythicitem.MySword.material>' },
        { placeholder: '<mythicitem.{Item}.model>', description: 'Returns CustomModelData of MythicItem', example: '<mythicitem.MySword.model>' },
        { placeholder: '<mythicitem.{Item}.display>', description: 'Returns display name of MythicItem', example: '<mythicitem.MySword.display>' },
        { placeholder: '<mythicitem.{Item}.itemstack>', description: 'Returns the ItemStack of MythicItem', example: '<mythicitem.MySword.itemstack>' }
    ],

    // Score Placeholders
    score: [
        { placeholder: '<caster.score.{Objective}>', description: 'Returns caster\'s score from objective', example: '<caster.score.kills>' },
        { placeholder: '<target.score.{Objective}>', description: 'Returns target\'s score from objective', example: '<target.score.deaths>' },
        { placeholder: '<trigger.score.{Objective}>', description: 'Returns trigger\'s score from objective', example: '<trigger.score.points>' },
        { placeholder: '<global.score.{Objective}>', description: 'Returns __GLOBAL__ fake player score', example: '<global.score.totalKills>' },
        { placeholder: '<score.{Objective}.{Player}>', description: 'Returns score of defined player', example: '<score.kills.Steve>' },
        { placeholder: '<score.{Objective}.{Dummy}>', description: 'Returns score of fake player', example: '<score.counter.MyDummy>' }
    ],

    // Variable Placeholders
    variable: [
        { placeholder: '<caster.var.{Name}>', description: 'Returns variable from caster\'s registry', example: '<caster.var.combo>' },
        { placeholder: '<target.var.{Name}>', description: 'Returns variable from target\'s registry', example: '<target.var.debuffStacks>' },
        { placeholder: '<world.var.{Name}>', description: 'Returns variable from world registry', example: '<world.var.dayCount>' },
        { placeholder: '<global.var.{Name}>', description: 'Returns variable from server registry', example: '<global.var.serverKills>' },
        { placeholder: '<skill.var.{Name}>', description: 'Returns variable from current skill tree', example: '<skill.var.tempValue>' }
    ],

    // Skill Variable Placeholders (automatic/contextual)
    skill: [
        { placeholder: '<skill.var.damage-amount>', description: 'Returns damage amount (onDamaged/onAttack)', context: '~onDamaged, ~onAttack, ~onBowHit' },
        { placeholder: '<skill.var.damage-type>', description: 'Returns damage type if any', context: '~onDamaged, ~onAttack' },
        { placeholder: '<skill.var.damage-cause>', description: 'Returns cause of damage', context: '~onDamaged, ~onAttack' },
        { placeholder: '<skill.var.aura-name>', description: 'Returns the name of the aura', context: 'Aura mechanics' },
        { placeholder: '<skill.var.aura-type>', description: 'Returns the type of the aura', context: 'Aura mechanics' },
        { placeholder: '<skill.var.aura-charges>', description: 'Returns remaining aura charges', context: 'Aura mechanics' },
        { placeholder: '<skill.var.aura-duration>', description: 'Returns remaining aura duration', context: 'Aura mechanics' },
        { placeholder: '<skill.var.aura-duration-millis>', description: 'Returns duration in milliseconds', context: 'Aura mechanics' },
        { placeholder: '<skill.var.aura-stacks>', description: 'Returns current aura stacks', context: 'Aura mechanics' },
        { placeholder: '<skill.var.input>', description: 'Returns chat input from player', context: 'onChat mechanic' },
        { placeholder: '<skill.var.interval>', description: 'Returns current repeat iteration', context: 'repeat/repeatInterval attributes' },
        { placeholder: '<skill.var.itr>', description: 'Returns current iteration (alias)', context: 'repeat/repeatInterval attributes' },
        { placeholder: '<skill.var.volume>', description: 'Returns sound intensity (1-15)', context: '~onHear trigger' },
        { placeholder: '<skill.var.sound-type>', description: 'Returns the type of sound heard', context: '~onHear trigger' },
        { placeholder: '<skill.var.hit-block-type>', description: 'Returns block hit by raytrace', context: 'raytrace mechanic' },
        { placeholder: '<skill.var.bow-tension>', description: 'Returns bow pull force', context: '~onShoot trigger' },
        { placeholder: '<skill.var.click-type>', description: 'Returns 1 for right-click, 0 otherwise', context: 'Custom Menu interactions' }
    ],

    // Color Codes
    color: [
        { placeholder: '&0', description: 'Black', color: '#000000' },
        { placeholder: '&1', description: 'Dark Blue', color: '#0000AA' },
        { placeholder: '&2', description: 'Dark Green', color: '#00AA00' },
        { placeholder: '&3', description: 'Dark Aqua', color: '#00AAAA' },
        { placeholder: '&4', description: 'Dark Red', color: '#AA0000' },
        { placeholder: '&5', description: 'Dark Purple', color: '#AA00AA' },
        { placeholder: '&6', description: 'Gold', color: '#FFAA00' },
        { placeholder: '&7', description: 'Gray', color: '#AAAAAA' },
        { placeholder: '&8', description: 'Dark Gray', color: '#555555' },
        { placeholder: '&9', description: 'Blue', color: '#5555FF' },
        { placeholder: '&a', description: 'Green', color: '#55FF55' },
        { placeholder: '&b', description: 'Aqua', color: '#55FFFF' },
        { placeholder: '&c', description: 'Red', color: '#FF5555' },
        { placeholder: '&d', description: 'Light Purple', color: '#FF55FF' },
        { placeholder: '&e', description: 'Yellow', color: '#FFFF55' },
        { placeholder: '&f', description: 'White', color: '#FFFFFF' },
        { placeholder: '&k', description: 'Obfuscated/Magic text', format: 'obfuscated' },
        { placeholder: '&l', description: 'Bold text', format: 'bold' },
        { placeholder: '&m', description: 'Strikethrough text', format: 'strikethrough' },
        { placeholder: '&n', description: 'Underlined text', format: 'underline' },
        { placeholder: '&o', description: 'Italic text', format: 'italic' },
        { placeholder: '&r', description: 'Reset formatting', format: 'reset' }
    ],

    // MiniMessage Tags (recommended)
    minimessage: [
        { placeholder: '<red>', description: 'Red text', example: '<red>Error!</red>' },
        { placeholder: '<green>', description: 'Green text', example: '<green>Success!</green>' },
        { placeholder: '<blue>', description: 'Blue text', example: '<blue>Info</blue>' },
        { placeholder: '<yellow>', description: 'Yellow text', example: '<yellow>Warning</yellow>' },
        { placeholder: '<gold>', description: 'Gold text', example: '<gold>Legendary</gold>' },
        { placeholder: '<aqua>', description: 'Aqua text', example: '<aqua>Rare</aqua>' },
        { placeholder: '<gray>', description: 'Gray text', example: '<gray>Common</gray>' },
        { placeholder: '<white>', description: 'White text', example: '<white>Text</white>' },
        { placeholder: '<black>', description: 'Black text', example: '<black>Shadow</black>' },
        { placeholder: '<dark_red>', description: 'Dark red text', example: '<dark_red>Danger</dark_red>' },
        { placeholder: '<dark_green>', description: 'Dark green text', example: '<dark_green>Nature</dark_green>' },
        { placeholder: '<dark_blue>', description: 'Dark blue text', example: '<dark_blue>Deep</dark_blue>' },
        { placeholder: '<dark_aqua>', description: 'Dark aqua text', example: '<dark_aqua>Ocean</dark_aqua>' },
        { placeholder: '<dark_purple>', description: 'Dark purple text', example: '<dark_purple>Magic</dark_purple>' },
        { placeholder: '<dark_gray>', description: 'Dark gray text', example: '<dark_gray>Whisper</dark_gray>' },
        { placeholder: '<light_purple>', description: 'Light purple text', example: '<light_purple>Enchanted</light_purple>' },
        { placeholder: '<bold>', description: 'Bold text', example: '<bold>Important</bold>' },
        { placeholder: '<italic>', description: 'Italic text', example: '<italic>emphasis</italic>' },
        { placeholder: '<underlined>', description: 'Underlined text', example: '<underlined>link</underlined>' },
        { placeholder: '<strikethrough>', description: 'Strikethrough text', example: '<strikethrough>old</strikethrough>' },
        { placeholder: '<obfuscated>', description: 'Obfuscated/magic text', example: '<obfuscated>???</obfuscated>' },
        { placeholder: '<rainbow>', description: 'Rainbow gradient text', example: '<rainbow>Colorful!</rainbow>' },
        { placeholder: '<gradient:#hex1:#hex2>', description: 'Custom gradient', example: '<gradient:#ff0000:#0000ff>Fire to Ice</gradient>' },
        { placeholder: '<#hexcode>', description: 'Custom hex color', example: '<#ff5733>Custom Color</#ff5733>' },
        { placeholder: '<click:open_url:URL>', description: 'Clickable URL', example: '<click:open_url:https://example.com>Click</click>' },
        { placeholder: '<hover:show_text:text>', description: 'Hover tooltip', example: '<hover:show_text:Info>Hover me</hover>' },
        { placeholder: '<newline>', description: 'Line break', example: 'Line1<newline>Line2' },
        { placeholder: '<reset>', description: 'Reset all formatting', example: '<red>Red<reset> Normal' }
    ],

    // PlaceholderAPI Integration
    papi: [
        { placeholder: '%mythic_var_someVar%', description: 'Returns player variable value', example: '%mythic_var_kills%' },
        { placeholder: '%mythic_var_world_someVar%', description: 'Returns world variable value', example: '%mythic_var_world_dayCount%' },
        { placeholder: '%mythic_var_global_someVar%', description: 'Returns server variable value', example: '%mythic_var_global_totalKills%' },
        { placeholder: '%mythic_var_<player>_someVar%', description: 'Returns variable from named player', example: '%mythic_var_Steve_score%' },
        { placeholder: '%mythic_var_<UUID>_someVar%', description: 'Returns variable from UUID', example: '%mythic_var_uuid_score%' },
        { placeholder: '%mythic_spawner_[name]_cooldown%', description: 'Returns spawner cooldown', example: '%mythic_spawner_BossSpawner_cooldown%' },
        { placeholder: '%mythic_spawner_[name]_cooldownleft%', description: 'Returns remaining cooldown', example: '%mythic_spawner_BossSpawner_cooldownleft%' },
        { placeholder: '%mythic_spawner_[name]_warmup%', description: 'Returns spawner warmup', example: '%mythic_spawner_BossSpawner_warmup%' },
        { placeholder: '%mythic_spawner_[name]_warmupleft%', description: 'Returns remaining warmup', example: '%mythic_spawner_BossSpawner_warmupleft%' },
        { placeholder: '%mythic_stat_[name]%', description: 'Returns player stat value', example: '%mythic_stat_STRENGTH%' }
    ],

    // Meta Variable Keywords (for variable manipulation)
    metaKeywords: {
        universal: [
            { keyword: '.cache', description: 'Cache result for subsequent parses', output: 'Same type' },
            { keyword: '.formatted', description: 'Human-readable format', output: 'STRING' },
            { keyword: '.toInteger', description: 'Convert to Integer', output: 'INTEGER' },
            { keyword: '.toFloat', description: 'Convert to Float', output: 'FLOAT' },
            { keyword: '.toLong', description: 'Convert to Long', output: 'LONG' },
            { keyword: '.toDouble', description: 'Convert to Double', output: 'DOUBLE' },
            { keyword: '.toBoolean', description: 'Convert to Boolean', output: 'BOOLEAN' },
            { keyword: '.toString', description: 'Convert to String', output: 'STRING' },
            { keyword: '.toLocation', description: 'Convert to Location', output: 'LOCATION' },
            { keyword: '.toVector', description: 'Convert to Vector', output: 'VECTOR' },
            { keyword: '.toList', description: 'Convert to List', output: 'LIST' },
            { keyword: '.toSet', description: 'Convert to Set', output: 'SET' },
            { keyword: '.toMap', description: 'Convert to Map', output: 'MAP' },
            { keyword: '.toTime', description: 'Convert to Time', output: 'TIME' }
        ],
        integer: [
            { keyword: '.add.{n}', description: 'Add value', example: '<var.count.add.5>' },
            { keyword: '.sub.{n}', description: 'Subtract value', example: '<var.count.sub.1>' },
            { keyword: '.mul.{n}', description: 'Multiply value', example: '<var.count.mul.2>' },
            { keyword: '.div.{n}', description: 'Divide value', example: '<var.count.div.2>' },
            { keyword: '.abs', description: 'Absolute value', example: '<var.count.abs>' }
        ],
        float: [
            { keyword: '.add.{n}', description: 'Add value', example: '<var.hp.add.0.5>' },
            { keyword: '.sub.{n}', description: 'Subtract value', example: '<var.hp.sub.0.1>' },
            { keyword: '.mul.{n}', description: 'Multiply value', example: '<var.hp.mul.1.5>' },
            { keyword: '.div.{n}', description: 'Divide value', example: '<var.hp.div.2>' },
            { keyword: '.abs', description: 'Absolute value', example: '<var.hp.abs>' },
            { keyword: '.round', description: 'Round to integer', example: '<var.hp.round>' },
            { keyword: '.precision.{n}', description: 'Set decimal precision', example: '<var.hp.precision.2>' }
        ],
        string: [
            { keyword: '.size', description: 'String length', example: '<var.name.size>' },
            { keyword: '.uppercase', description: 'Convert to uppercase', example: '<var.name.uppercase>' },
            { keyword: '.lowercase', description: 'Convert to lowercase', example: '<var.name.lowercase>' },
            { keyword: '.capitalize', description: 'Capitalize first letter', example: '<var.name.capitalize>' },
            { keyword: '.trim', description: 'Remove leading/trailing spaces', example: '<var.name.trim>' },
            { keyword: '.replace.{old}.{new}', description: 'Replace text', example: '<var.text.replace.bad.good>' },
            { keyword: '.remove.{text}', description: 'Remove text', example: '<var.text.remove.prefix>' },
            { keyword: '.contains.{text}', description: 'Check if contains text', example: '<var.text.contains.admin>' },
            { keyword: '.substring.{start}.{end}', description: 'Extract substring', example: '<var.text.substring.0.5>' },
            { keyword: '.shift.{n}', description: 'Remove first n chars', example: '<var.text.shift.3>' },
            { keyword: '.split.{regex}.{joiner}', description: 'Split and rejoin', example: '<var.text.split.-.+>' },
            { keyword: '.indexof.{text}', description: 'Find first index', example: '<var.text.indexof.@>' },
            { keyword: '.lastindexof.{text}', description: 'Find last index', example: '<var.text.lastindexof.@>' },
            { keyword: '.startswith.{text}', description: 'Check if starts with', example: '<var.text.startswith.Hello>' },
            { keyword: '.endswith.{text}', description: 'Check if ends with', example: '<var.text.endswith.!>' },
            { keyword: '.append.{text}', description: 'Append text', example: '<var.text.append.suffix>' },
            { keyword: '.prepend.{text}', description: 'Prepend text', example: '<var.text.prepend.prefix>' },
            { keyword: '.insert.{index}.{text}', description: 'Insert at index', example: '<var.text.insert.5.middle>' },
            { keyword: '.regex.{pattern}', description: 'Match regex pattern', example: '<var.text.regex.^[A-Z]>' },
            { keyword: '.{index}', description: 'Get character at index', example: '<var.text.0>' }
        ],
        boolean: [
            { keyword: '.inverse', description: 'Invert boolean', example: '<var.flag.inverse>' },
            { keyword: '.number', description: 'Convert to 0/1', example: '<var.flag.number>' },
            { keyword: '.yesno', description: 'Convert to yes/no', example: '<var.flag.yesno>' },
            { keyword: '.union.{bool}', description: 'Logical OR', example: '<var.flag.union.true>' },
            { keyword: '.intersection.{bool}', description: 'Logical AND', example: '<var.flag.intersection.true>' },
            { keyword: '.difference.{bool}', description: 'True if A and not B', example: '<var.flag.difference.false>' }
        ],
        long: [
            { keyword: '.add.{n}', description: 'Add value', example: '<var.epoch.add.1000>' },
            { keyword: '.sub.{n}', description: 'Subtract value', example: '<var.epoch.sub.500>' },
            { keyword: '.mul.{n}', description: 'Multiply value', example: '<var.epoch.mul.2>' },
            { keyword: '.div.{n}', description: 'Divide value', example: '<var.epoch.div.2>' },
            { keyword: '.abs', description: 'Absolute value', example: '<var.epoch.abs>' }
        ],
        double: [
            { keyword: '.add.{n}', description: 'Add value', example: '<var.precise.add.0.001>' },
            { keyword: '.sub.{n}', description: 'Subtract value', example: '<var.precise.sub.0.001>' },
            { keyword: '.mul.{n}', description: 'Multiply value', example: '<var.precise.mul.1.5>' },
            { keyword: '.div.{n}', description: 'Divide value', example: '<var.precise.div.2>' },
            { keyword: '.abs', description: 'Absolute value', example: '<var.precise.abs>' },
            { keyword: '.round', description: 'Round to long', example: '<var.precise.round>' },
            { keyword: '.precision.{n}', description: 'Set decimal precision', example: '<var.precise.precision.4>' }
        ],
        set: [
            { keyword: '.size', description: 'Number of elements', example: '<var.tags.size>' },
            { keyword: '.join.{delimiter}', description: 'Join elements with delimiter', example: '<var.tags.join.,>' },
            { keyword: '.contains.{element}', description: 'Check if set contains element', example: '<var.tags.contains.fire>' }
        ],
        list: [
            { keyword: '.size', description: 'Number of elements', example: '<var.items.size>' },
            { keyword: '.first', description: 'First element', example: '<var.items.first>' },
            { keyword: '.last', description: 'Last element', example: '<var.items.last>' },
            { keyword: '.reverse', description: 'Reverse list', example: '<var.items.reverse>' },
            { keyword: '.sort', description: 'Sort alphabetically', example: '<var.items.sort>' },
            { keyword: '.sortnum', description: 'Sort numerically', example: '<var.numbers.sortnum>' },
            { keyword: '.shuffle', description: 'Randomize order', example: '<var.items.shuffle>' },
            { keyword: '.get.{index}', description: 'Get element at index', example: '<var.items.get.0>' },
            { keyword: '.join.{delimiter}', description: 'Join with delimiter', example: '<var.items.join.,>' },
            { keyword: '.contains.{element}', description: 'Check if contains', example: '<var.items.contains.sword>' },
            { keyword: '.maxnumber', description: 'Maximum numeric value', example: '<var.numbers.maxnumber>' },
            { keyword: '.minnumber', description: 'Minimum numeric value', example: '<var.numbers.minnumber>' },
            { keyword: '.indexof.{value}', description: 'First index of value', example: '<var.items.indexof.apple>' },
            { keyword: '.lastindexof.{value}', description: 'Last index of value', example: '<var.items.lastindexof.apple>' },
            { keyword: '.slice.{from}.{to}', description: 'Get slice of list', example: '<var.items.slice.1.5>' },
            { keyword: '.slicefrom.{index}', description: 'Slice from index to end', example: '<var.items.slicefrom.3>' },
            { keyword: '.sliceto.{index}', description: 'Slice from start to index', example: '<var.items.sliceto.5>' },
            { keyword: '.append.{value}', description: 'Add to end', example: '<var.items.append.newItem>' },
            { keyword: '.prepend.{value}', description: 'Add to start', example: '<var.items.prepend.first>' },
            { keyword: '.insert.{index}.{value}', description: 'Insert at index', example: '<var.items.insert.2.middle>' },
            { keyword: '.remove.{index}', description: 'Remove at index', example: '<var.items.remove.0>' },
            { keyword: '.{index}', description: 'Get element (shorthand)', example: '<var.items.2>' }
        ],
        location: [
            { keyword: '.x', description: 'X coordinate', example: '<var.loc.x>' },
            { keyword: '.y', description: 'Y coordinate', example: '<var.loc.y>' },
            { keyword: '.z', description: 'Z coordinate', example: '<var.loc.z>' },
            { keyword: '.world', description: 'World name', example: '<var.loc.world>' },
            { keyword: '.yaw', description: 'Yaw rotation', example: '<var.loc.yaw>' },
            { keyword: '.pitch', description: 'Pitch rotation', example: '<var.loc.pitch>' },
            { keyword: '.coords', description: 'List of X,Y,Z', example: '<var.loc.coords>' }
        ],
        vector: [
            { keyword: '.x', description: 'X component', example: '<var.vec.x>' },
            { keyword: '.y', description: 'Y component', example: '<var.vec.y>' },
            { keyword: '.z', description: 'Z component', example: '<var.vec.z>' },
            { keyword: '.normalized', description: 'Normalized vector', example: '<var.vec.normalized>' },
            { keyword: '.length', description: 'Vector magnitude', example: '<var.vec.length>' },
            { keyword: '.mul.{vector}', description: 'Multiply vectors', example: '<var.vec.mul.1,2,1>' },
            { keyword: '.div.{vector}', description: 'Divide vectors', example: '<var.vec.div.2,2,2>' },
            { keyword: '.add.{vector}', description: 'Add vectors', example: '<var.vec.add.0,1,0>' },
            { keyword: '.sub.{vector}', description: 'Subtract vectors', example: '<var.vec.sub.1,0,0>' },
            { keyword: '.rotate.{axis}.{angle}', description: 'Rotate around axis', example: '<var.vec.rotate.y.1.57>' }
        ],
        map: [
            { keyword: '.size', description: 'Number of entries', example: '<var.data.size>' },
            { keyword: '.keys', description: 'List of all keys', example: '<var.data.keys>' },
            { keyword: '.values', description: 'List of all values', example: '<var.data.values>' },
            { keyword: '.get.{key}', description: 'Get value by key', example: '<var.data.get.name>' },
            { keyword: '.{key}', description: 'Get value (shorthand)', example: '<var.data.name>' }
        ],
        time: [
            { keyword: '.delta.{timestamp}', description: 'Time difference', example: '<var.start.delta.<utils.epoch>>' },
            { keyword: '.formatted.{pattern}', description: 'Format as date/time', example: '<var.time.formatted.UTC>' },
            { keyword: '.duration', description: 'Format as duration', example: '<var.elapsed.duration>' }
        ],
        item: [
            { keyword: '.withType.{material}', description: 'Change item type', example: '<var.item.withType.DIAMOND_SWORD>' },
            { keyword: '.withDurability.{value}', description: 'Set durability', example: '<var.item.withDurability.100>' },
            { keyword: '.withMaxDurability.{value}', description: 'Set max durability', example: '<var.item.withMaxDurability.500>' },
            { keyword: '.withLore.{list}', description: 'Set lore lines', example: '<var.item.withLore.Line1,Line2>' },
            { keyword: '.withName.{name}', description: 'Set display name', example: '<var.item.withName.Epic Sword>' },
            { keyword: '.withMythicType.{type}', description: 'Set Mythic item type', example: '<var.item.withMythicType.MySword>' },
            { keyword: '.withEnchants.{map}', description: 'Set enchantments', example: '<var.item.withEnchants.sharpness=5>' },
            { keyword: '.withCustomData.{ns}.{key}.{val}', description: 'Set persistent data', example: '<var.item.withCustomData.my.id.123>' },
            { keyword: '.withAmount.{value}', description: 'Set stack amount', example: '<var.item.withAmount.64>' },
            { keyword: '.withUUID.{uuid}', description: 'Set item UUID', example: '<var.item.withUUID.uuid>' },
            { keyword: '.withTimestamp.{value}', description: 'Set timestamp NBT', example: '<var.item.withTimestamp.123456>' },
            { keyword: '.withCustomModelData.{value}', description: 'Set CustomModelData', example: '<var.item.withCustomModelData.1001>' },
            { keyword: '.withModel.{ns}.{path}', description: 'Set item model', example: '<var.item.withModel.my.sword>' },
            { keyword: '.type', description: 'Get material name', example: '<var.item.type>' },
            { keyword: '.durability', description: 'Get durability', example: '<var.item.durability>' },
            { keyword: '.maxDurability', description: 'Get max durability', example: '<var.item.maxDurability>' },
            { keyword: '.lore', description: 'Get lore as list', example: '<var.item.lore>' },
            { keyword: '.name', description: 'Get display name', example: '<var.item.name>' },
            { keyword: '.mythicType', description: 'Get Mythic item type', example: '<var.item.mythicType>' },
            { keyword: '.enchants', description: 'Get enchantments map', example: '<var.item.enchants>' },
            { keyword: '.getCustomData.{ns}.{key}', description: 'Get persistent data', example: '<var.item.getCustomData.my.id>' },
            { keyword: '.customModelData', description: 'Get CustomModelData', example: '<var.item.customModelData>' },
            { keyword: '.model', description: 'Get item model', example: '<var.item.model>' },
            { keyword: '.amount', description: 'Get stack amount', example: '<var.item.amount>' }
        ]
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.PLACEHOLDERS_DATA = PLACEHOLDERS_DATA;
}
