// Equipment slots from MythicMobs wiki (for equipment section)
const EQUIPMENT_SLOT_LIST = [
  {
    value: 'HEAD',
    label: 'Head',
    description: 'Accepts regular helmets, playerheads, and even blocktypes',
    icon: 'fa-helmet-battle'
  },
  {
    value: 'CHEST',
    label: 'Chest',
    description: 'Will only render chestplates, but will carry any items',
    icon: 'fa-vest'
  },
  {
    value: 'LEGS',
    label: 'Legs',
    description: 'Will only render leggings, but will carry any items',
    icon: 'fa-person'
  },
  {
    value: 'FEET',
    label: 'Feet',
    description: 'Will only render boots, but will carry any items',
    icon: 'fa-shoe-prints'
  },
  {
    value: 'HAND',
    label: 'Main Hand',
    description: 'The mainhand (right) hand slot',
    icon: 'fa-hand-fist'
  },
  {
    value: 'OFFHAND',
    label: 'Off Hand',
    description: 'The offhand (left) hand slot',
    icon: 'fa-hand'
  }
];

// Inline item attributes from wiki (for equipment section)
const EQUIPMENT_INLINE_ATTRIBUTES = [
  {
    attribute: 'name',
    aliases: ['display', 'n', 'd'],
    description: 'The display name of the item',
    type: 'string',
    example: 'name="Dark Leather"'
  },
  {
    attribute: 'data',
    aliases: [],
    description: 'The "Data" of the item, not to be confused with CustomModelData',
    type: 'number',
    example: 'data=1'
  },
  {
    attribute: 'model',
    aliases: [],
    description: 'The CustomModelData of the item',
    type: 'number',
    example: 'model=100'
  },
  {
    attribute: 'amount',
    aliases: ['a'],
    description: 'The amount of the item',
    type: 'number',
    example: 'amount=64'
  },
  {
    attribute: 'lore',
    aliases: ['l'],
    description: 'The lore of the item',
    type: 'string',
    example: 'lore="&8A vest made of darkened leather"'
  },
  {
    attribute: 'enchantments',
    aliases: ['enchants', 'ench', 'e'],
    description: 'A list of enchantments of the item',
    type: 'string',
    example: 'enchants=PROTECTION_ENVIRONMENTAL:4,DURABILITY:3'
  },
  {
    attribute: 'potioneffects',
    aliases: ['peffects', 'potion', 'pe'],
    description: 'A list of potion effects of the item, if a potion',
    type: 'string',
    example: 'potioneffects=SPEED:1:30'
  },
  {
    attribute: 'color',
    aliases: ['c', 'potioncolor', 'pcolor', 'pc'],
    description: 'The color of the item, if a potion or leather armor',
    type: 'string',
    example: 'color=BLACK'
  },
  {
    attribute: 'skullowner',
    aliases: [],
    description: 'The owner of the item, if a skull',
    type: 'string',
    example: 'skullowner=Notch'
  },
  {
    attribute: 'skulltexture',
    aliases: [],
    description: 'The SkinURL of the texture of the item, if a skull',
    type: 'string',
    example: 'skulltexture=eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6...'
  }
];
