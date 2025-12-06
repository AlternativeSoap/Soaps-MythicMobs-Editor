/**
 * Math Operations Documentation for MythicMobs Placeholders
 * Based on MythicMobs wiki: https://git.mythiccraft.io/mythiccraft/MythicMobs/-/wikis/Skills/Placeholders
 */

const MATH_OPERATORS = [
    {
        symbol: '+',
        name: 'Addition',
        description: 'Add two values',
        example: '<caster.hp> + 10',
        result: 'Current HP plus 10'
    },
    {
        symbol: '-',
        name: 'Subtraction',
        description: 'Subtract second value from first',
        example: '<caster.hp> - 5',
        result: 'Current HP minus 5'
    },
    {
        symbol: '*',
        name: 'Multiplication',
        description: 'Multiply two values',
        example: '<caster.level> * 2',
        result: 'Mob level times 2'
    },
    {
        symbol: '/',
        name: 'Division',
        description: 'Divide first value by second',
        example: '<caster.hp> / 2',
        result: 'Current HP divided by 2'
    },
    {
        symbol: '^',
        name: 'Exponentiation',
        description: 'Raise first value to power of second',
        example: '<caster.level> ^ 2',
        result: 'Mob level squared'
    },
    {
        symbol: '%',
        name: 'Modulo',
        description: 'Remainder after division',
        example: '<caster.level> % 5',
        result: 'Remainder when level divided by 5'
    }
];

const COMPARISON_OPERATORS = [
    {
        symbol: '<',
        name: 'Less Than',
        description: 'Check if first value is less than second',
        example: '<caster.hp> < 100',
        result: 'true if HP below 100'
    },
    {
        symbol: '<=',
        name: 'Less Than or Equal',
        description: 'Check if first value is less than or equal to second',
        example: '<caster.hp> <= 50',
        result: 'true if HP is 50 or below'
    },
    {
        symbol: '>',
        name: 'Greater Than',
        description: 'Check if first value is greater than second',
        example: '<caster.level> > 10',
        result: 'true if level above 10'
    },
    {
        symbol: '>=',
        name: 'Greater Than or Equal',
        description: 'Check if first value is greater than or equal to second',
        example: '<caster.level> >= 5',
        result: 'true if level is 5 or above'
    },
    {
        symbol: '==',
        name: 'Equals',
        description: 'Check if two values are equal',
        example: '<caster.level> == 20',
        result: 'true if level is exactly 20'
    }
];

const MATH_FUNCTIONS = [
    {
        name: 'abs',
        description: 'Absolute value (remove negative sign)',
        syntax: 'abs(value)',
        example: 'abs(-10)',
        result: '10'
    },
    {
        name: 'sqrt',
        description: 'Square root of value',
        syntax: 'sqrt(value)',
        example: 'sqrt(16)',
        result: '4'
    },
    {
        name: 'floor',
        description: 'Round down to nearest integer',
        syntax: 'floor(value)',
        example: 'floor(3.7)',
        result: '3'
    },
    {
        name: 'ceil',
        description: 'Round up to nearest integer',
        syntax: 'ceil(value)',
        example: 'ceil(3.2)',
        result: '4'
    },
    {
        name: 'round',
        description: 'Round to nearest integer',
        syntax: 'round(value)',
        example: 'round(3.5)',
        result: '4'
    },
    {
        name: 'min',
        description: 'Return smallest of multiple values',
        syntax: 'min(value1, value2, ...)',
        example: 'min(<caster.hp>, 100)',
        result: 'HP capped at 100'
    },
    {
        name: 'max',
        description: 'Return largest of multiple values',
        syntax: 'max(value1, value2, ...)',
        example: 'max(<caster.level>, 1)',
        result: 'Level with minimum of 1'
    },
    {
        name: 'random',
        description: 'Random decimal between 0 and 1',
        syntax: 'random()',
        example: 'random() * 100',
        result: 'Random number 0-100'
    },
    {
        name: 'randomInt',
        description: 'Random integer in range (inclusive)',
        syntax: 'randomInt(min, max)',
        example: 'randomInt(1, 10)',
        result: 'Random integer 1-10'
    },
    {
        name: 'clamp',
        description: 'Constrain value between min and max',
        syntax: 'clamp(value, min, max)',
        example: 'clamp(<caster.hp>, 0, 100)',
        result: 'HP between 0 and 100'
    },
    {
        name: 'lerp',
        description: 'Linear interpolation between two values',
        syntax: 'lerp(start, end, t)',
        example: 'lerp(0, 100, 0.5)',
        result: '50 (halfway between 0 and 100)'
    }
];

const MATH_EXAMPLES = [
    {
        title: 'Scaling Damage',
        code: `Skills:
- damage{amount="<caster.level> * 5"} @target`,
        description: 'Damage scales with mob level (level 10 = 50 damage)'
    },
    {
        title: 'Health-Based Effect',
        code: `Skills:
- particles{amount="floor(<caster.hp> / 10)"} @self`,
        description: 'More particles when higher HP (100 HP = 10 particles)'
    },
    {
        title: 'Random Range',
        code: `Skills:
- damage{amount="randomInt(10, 20)"} @target`,
        description: 'Random damage between 10 and 20'
    },
    {
        title: 'Percentage Calculation',
        code: `Skills:
- heal{amount="<caster.maxhp> * 0.25"} @self`,
        description: 'Heal 25% of maximum health'
    },
    {
        title: 'Clamped Value',
        code: `Skills:
- damage{amount="clamp(<caster.level> * 3, 5, 50)"} @target`,
        description: 'Damage between 5-50, based on level'
    },
    {
        title: 'Complex Calculation',
        code: `Skills:
- damage{amount="max(10, (<caster.level> ^ 1.5) * 2)"} @target`,
        description: 'Exponential scaling with minimum of 10 damage'
    }
];

// Export for global access
window.MathDocumentation = {
    MATH_OPERATORS,
    COMPARISON_OPERATORS,
    MATH_FUNCTIONS,
    MATH_EXAMPLES
};

console.log('✅ Math Documentation loaded');
