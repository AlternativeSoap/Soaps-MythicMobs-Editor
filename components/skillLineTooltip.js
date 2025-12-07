/**
 * Skill Line Context Tooltips
 * Provides helpful information on hover for mechanics, targeters, and attributes
 */

class SkillLineTooltip {
    constructor() {
        this.tooltip = null;
        this.currentTarget = null;
        this.isPinned = false;
        this.showDelay = 500; // ms
        this.hideDelay = 100; // ms
        this.showTimeout = null;
        this.hideTimeout = null;
        
        // Initialize knowledge base
        this.knowledgeBase = this.buildKnowledgeBase();
    }

    /**
     * Build comprehensive knowledge base
     */
    buildKnowledgeBase() {
        return {
            mechanics: this.getMechanics(),
            targeters: this.getTargeters(),
            conditions: this.getConditions(),
            triggers: this.getTriggers(),
            attributes: this.getAttributes()
        };
    }

    /**
     * Get mechanic definitions (subset of most common)
     */
    getMechanics() {
        return {
            // Damage
            'damage': {
                name: 'Damage',
                description: 'Deals damage to the target entity',
                category: 'Offense',
                params: {
                    'a': 'Amount of damage',
                    'amount': 'Amount of damage',
                    'i': 'Ignore armor (true/false)',
                    'pk': 'Prevent knockback (true/false)'
                },
                example: 'damage{a=10;i=true} @target'
            },
            'basedamage': {
                name: 'Base Damage',
                description: 'Deals damage based on mob\'s base damage stat',
                category: 'Offense',
                params: {
                    'm': 'Multiplier',
                    'i': 'Ignore armor'
                },
                example: 'basedamage{m=2} @target'
            },
            'percentdamage': {
                name: 'Percent Damage',
                description: 'Deals damage as percentage of target\'s max health',
                category: 'Offense',
                params: {
                    'p': 'Percentage (0-1)',
                    'i': 'Ignore armor'
                },
                example: 'percentdamage{p=0.25} @target'
            },
            
            // Projectiles
            'projectile': {
                name: 'Projectile',
                description: 'Launches a projectile entity',
                category: 'Projectile',
                params: {
                    'onTick': 'Skill to execute on each tick',
                    'onHit': 'Skill to execute on hit',
                    'onEnd': 'Skill to execute on end',
                    'v': 'Velocity/speed',
                    'i': 'Interval in ticks',
                    'd': 'Duration/max distance in ticks',
                    'hR': 'Horizontal hit radius',
                    'vR': 'Vertical hit radius',
                    'hnp': 'Hit non-players'
                },
                example: 'projectile{onTick=PT;onHit=PH;v=8;i=1} @target'
            },
            'missile': {
                name: 'Missile',
                description: 'Launches a homing missile',
                category: 'Projectile',
                params: {
                    'onTick': 'Skill on tick',
                    'onHit': 'Skill on hit',
                    'onEnd': 'Skill on end',
                    'v': 'Velocity',
                    'i': 'Interval',
                    'hnp': 'Hit non-players'
                },
                example: 'missile{onTick=MT;onHit=MH;v=5} @target'
            },
            'orbital': {
                name: 'Orbital',
                description: 'Creates orbiting projectiles around caster',
                category: 'Projectile',
                params: {
                    'onTick': 'Skill on tick',
                    'onHit': 'Skill on hit',
                    'points': 'Number of orbitals',
                    'radius': 'Orbit radius',
                    'interval': 'Tick interval',
                    'duration': 'Duration in ticks'
                },
                example: 'orbital{onTick=OT;points=4;radius=3} @self'
            },
            
            // Effects
            'effect': {
                name: 'Effect',
                description: 'Plays a particle or sound effect',
                category: 'Effects',
                params: {
                    'p': 'Particle type',
                    'particle': 'Particle type',
                    'a': 'Amount',
                    'amount': 'Amount',
                    'speed': 'Particle speed',
                    'hS': 'Horizontal spread',
                    'vS': 'Vertical spread'
                },
                example: 'effect:particles{p=flame;a=20;speed=0.1}'
            },
            'particles': {
                name: 'Particles',
                description: 'Spawns particle effects',
                category: 'Effects',
                params: {
                    'p': 'Particle type',
                    'a': 'Amount',
                    'speed': 'Speed',
                    'hS': 'Horizontal spread',
                    'vS': 'Vertical spread'
                },
                example: 'particles{p=flame;a=10} @origin'
            },
            'sound': {
                name: 'Sound',
                description: 'Plays a sound effect',
                category: 'Effects',
                params: {
                    's': 'Sound name',
                    'sound': 'Sound name',
                    'v': 'Volume',
                    'volume': 'Volume (0-2)',
                    'p': 'Pitch',
                    'pitch': 'Pitch (0.5-2)'
                },
                example: 'sound{s=entity.generic.explode;v=1;p=1}'
            },
            
            // Buffs/Debuffs
            'potion': {
                name: 'Potion Effect',
                description: 'Applies a potion effect to target',
                category: 'Buffs',
                params: {
                    'type': 'Effect type (SPEED, SLOW, etc.)',
                    'd': 'Duration in ticks',
                    'duration': 'Duration in ticks',
                    'l': 'Level (0-based)',
                    'lvl': 'Level (0-based)',
                    'level': 'Level (0-based)'
                },
                example: 'potion{type=SPEED;d=200;l=1} @self'
            },
            'removepotion': {
                name: 'Remove Potion',
                description: 'Removes a potion effect from target',
                category: 'Buffs',
                params: {
                    'type': 'Effect type to remove'
                },
                example: 'removepotion{type=SLOW} @self'
            },
            
            // Auras
            'aura': {
                name: 'Aura',
                description: 'Creates a persistent aura effect',
                category: 'Aura',
                params: {
                    'onTick': 'Skill to run each tick',
                    'onStart': 'Skill on aura start',
                    'onEnd': 'Skill on aura end',
                    'd': 'Duration in ticks',
                    'i': 'Interval in ticks',
                    'auraName': 'Unique identifier',
                    'charges': 'Number of charges'
                },
                example: 'aura{onTick=AT;d=200;i=20;auraName=shield}'
            },
            'removeaura': {
                name: 'Remove Aura',
                description: 'Removes an active aura by name',
                category: 'Aura',
                params: {
                    'auraName': 'Name of aura to remove'
                },
                example: 'removeaura{auraName=shield} @self'
            },
            
            // Teleportation
            'teleport': {
                name: 'Teleport',
                description: 'Teleports target to location',
                category: 'Movement',
                params: {
                    's': 'Spread/randomness'
                },
                example: 'teleport @origin'
            },
            'leap': {
                name: 'Leap',
                description: 'Makes target leap toward location',
                category: 'Movement',
                params: {
                    'v': 'Velocity/power'
                },
                example: 'leap{v=5} @target'
            },
            'thrust': {
                name: 'Thrust',
                description: 'Applies velocity to target',
                category: 'Movement',
                params: {
                    'v': 'Velocity',
                    's': 'Spread'
                },
                example: 'thrust{v=2} @forward{f=1}'
            },
            
            // Utility
            'heal': {
                name: 'Heal',
                description: 'Heals target entity',
                category: 'Utility',
                params: {
                    'a': 'Amount to heal',
                    'amount': 'Amount to heal',
                    'o': 'Overheal allowed'
                },
                example: 'heal{a=10} @self'
            },
            'message': {
                name: 'Message',
                description: 'Sends message to player',
                category: 'Utility',
                params: {
                    'm': 'Message text',
                    'message': 'Message text'
                },
                example: 'message{m="<red>You have been cursed!"}'
            },
            'command': {
                name: 'Command',
                description: 'Executes a command',
                category: 'Utility',
                params: {
                    'c': 'Command to execute',
                    'command': 'Command to execute'
                },
                example: 'command{c="give <target.name> diamond 1"}'
            },
            'skill': {
                name: 'Skill',
                description: 'Executes another skill (metaskill)',
                category: 'Utility',
                params: {
                    's': 'Skill name',
                    'skill': 'Skill name'
                },
                example: 'skill{s=FireballAttack} @target'
            }
        };
    }

    /**
     * Get targeter definitions
     */
    getTargeters() {
        return {
            '@Self': {
                name: 'Self',
                description: 'Targets the caster/mob itself',
                example: '@Self',
                aliases: ['@Caster', '@Me']
            },
            '@Target': {
                name: 'Target',
                description: 'Targets the mob\'s current threat target',
                example: '@Target'
            },
            '@Trigger': {
                name: 'Trigger',
                description: 'Targets the entity that triggered the skill',
                example: '@Trigger'
            },
            '@Origin': {
                name: 'Origin',
                description: 'Targets the location where skill was cast',
                example: '@Origin'
            },
            '@Forward': {
                name: 'Forward',
                description: 'Targets location in front of caster',
                params: {
                    'f': 'Forward distance',
                    'y': 'Y offset'
                },
                example: '@Forward{f=5;y=1}'
            },
            '@EntitiesInRadius': {
                name: 'Entities In Radius',
                description: 'Targets all entities within radius',
                params: {
                    'r': 'Radius',
                    'type': 'Entity type filter'
                },
                example: '@EntitiesInRadius{r=10}',
                aliases: ['@EIR']
            },
            '@PlayersInRadius': {
                name: 'Players In Radius',
                description: 'Targets all players within radius',
                params: {
                    'r': 'Radius'
                },
                example: '@PlayersInRadius{r=20}',
                aliases: ['@PIR']
            },
            '@MobsInRadius': {
                name: 'Mobs In Radius',
                description: 'Targets all mobs within radius',
                params: {
                    'r': 'Radius',
                    'type': 'Mob type filter'
                },
                example: '@MobsInRadius{r=15}',
                aliases: ['@MIR']
            },
            '@Line': {
                name: 'Line',
                description: 'Targets locations along a line',
                params: {
                    'points': 'Number of points',
                    'maxdistance': 'Max distance'
                },
                example: '@Line{points=10;maxdistance=20}'
            },
            '@Ring': {
                name: 'Ring',
                description: 'Targets locations in a ring pattern',
                params: {
                    'radius': 'Ring radius',
                    'points': 'Number of points'
                },
                example: '@Ring{radius=5;points=12}'
            }
        };
    }

    /**
     * Get condition definitions (subset)
     */
    getConditions() {
        return {
            'health': {
                name: 'Health',
                description: 'Checks target\'s health',
                params: {
                    'a': 'Amount',
                    'amount': 'Health amount',
                    'p': 'Percentage'
                },
                example: '?health{<50%}'
            },
            'stance': {
                name: 'Stance',
                description: 'Checks if mob is in stance',
                params: {
                    's': 'Stance name'
                },
                example: '?stance{s=aggressive}'
            },
            'distance': {
                name: 'Distance',
                description: 'Checks distance to target',
                params: {
                    'd': 'Distance',
                    '<': 'Less than',
                    '>': 'Greater than'
                },
                example: '?distance{<10}'
            },
            'playerwithin': {
                name: 'Player Within',
                description: 'Checks if player is within range',
                params: {
                    'r': 'Radius'
                },
                example: '?playerwithin{r=20}'
            }
        };
    }

    /**
     * Get trigger definitions
     */
    getTriggers() {
        return {
            'onAttack': 'Triggers when mob attacks',
            'onDamaged': 'Triggers when mob takes damage',
            'onSpawn': 'Triggers when mob spawns',
            'onDeath': 'Triggers when mob dies',
            'onTimer': 'Triggers on a timer (requires interval)',
            'onInteract': 'Triggers when player interacts',
            'onCombat': 'Triggers when entering combat',
            'onDropCombat': 'Triggers when leaving combat'
        };
    }

    /**
     * Get attribute definitions
     */
    getAttributes() {
        return {
            // Damage
            'a': 'Amount (damage, heal, etc.)',
            'amount': 'Amount value',
            'i': 'Ignore armor OR Interval (context)',
            
            // Projectile
            'v': 'Velocity/Speed',
            'velocity': 'Velocity/Speed',
            'd': 'Duration in ticks',
            'duration': 'Duration in ticks',
            'hR': 'Horizontal hit radius',
            'vR': 'Vertical hit radius',
            'hnp': 'Hit non-players (true/false)',
            'hp': 'Hit players (true/false)',
            
            // Effects
            'p': 'Particle type OR Pitch (context)',
            'particle': 'Particle type',
            'speed': 'Particle speed',
            'hS': 'Horizontal spread',
            'vS': 'Vertical spread',
            
            // Sound
            's': 'Sound name OR Skill name (context)',
            'sound': 'Sound name',
            'volume': 'Sound volume (0-2)',
            'pitch': 'Sound pitch (0.5-2)',
            
            // Potion
            'type': 'Effect or entity type',
            'l': 'Level (0-based)',
            'lvl': 'Level (0-based)',
            'level': 'Level (0-based)',
            
            // Callbacks
            'onTick': 'Skill to run on tick',
            'onHit': 'Skill to run on hit',
            'onEnd': 'Skill to run on end',
            'onStart': 'Skill to run on start',
            'onBounce': 'Skill to run on bounce',
            
            // Aura
            'auraName': 'Unique aura identifier',
            'charges': 'Number of charges',
            
            // Targeting
            'r': 'Radius',
            'radius': 'Radius value',
            'f': 'Forward distance',
            'y': 'Y offset'
        };
    }

    /**
     * Enable tooltips on a container element
     */
    enableTooltips(container) {
        // Find all skill line previews
        const previews = container.querySelectorAll('.skill-line-preview');
        
        previews.forEach(preview => {
            this.makeTooltipEnabled(preview);
        });
    }

    /**
     * Make an element tooltip-enabled
     */
    makeTooltipEnabled(element) {
        element.style.cursor = 'help';
        
        element.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e, element);
        });
        
        element.addEventListener('mouseleave', () => {
            if (!this.isPinned) {
                this.hideTooltip();
            }
        });
        
        element.addEventListener('click', (e) => {
            if (e.ctrlKey || e.metaKey) {
                this.togglePin();
            }
        });
    }

    /**
     * Handle mouse move to detect hoverable elements
     */
    handleMouseMove(e, element) {
        if (this.isPinned) return;
        
        const text = element.textContent;
        const parsed = SkillLineParser.parse(text);
        
        // Get word under cursor
        const range = this.getWordAtPosition(element, e.clientX, e.clientY);
        if (!range) {
            this.scheduleHide();
            return;
        }
        
        const word = range.toString().trim();
        if (!word) {
            this.scheduleHide();
            return;
        }
        
        // Try to find info for this word
        const info = this.getInfoForWord(word, parsed);
        if (info) {
            this.scheduleShow(info, e.clientX, e.clientY);
        } else {
            this.scheduleHide();
        }
    }

    /**
     * Get word at cursor position
     */
    getWordAtPosition(element, x, y) {
        const range = document.caretRangeFromPoint(x, y);
        if (!range) return null;
        
        const textNode = range.startContainer;
        if (textNode.nodeType !== Node.TEXT_NODE) return null;
        
        const text = textNode.textContent;
        let start = range.startOffset;
        let end = range.startOffset;
        
        // Expand to word boundaries
        const wordChars = /[a-zA-Z0-9@_{}:;=.]/;
        
        while (start > 0 && wordChars.test(text[start - 1])) {
            start--;
        }
        
        while (end < text.length && wordChars.test(text[end])) {
            end++;
        }
        
        range.setStart(textNode, start);
        range.setEnd(textNode, end);
        
        return range;
    }

    /**
     * Get information for a word
     */
    getInfoForWord(word, parsed) {
        // Check if it's a mechanic
        if (this.knowledgeBase.mechanics[word.toLowerCase()]) {
            return {
                type: 'mechanic',
                data: this.knowledgeBase.mechanics[word.toLowerCase()]
            };
        }
        
        // Check if it's a targeter
        if (word.startsWith('@')) {
            const targeterName = word.split('{')[0]; // Remove params
            if (this.knowledgeBase.targeters[targeterName]) {
                return {
                    type: 'targeter',
                    data: this.knowledgeBase.targeters[targeterName]
                };
            }
        }
        
        // Check if it's a trigger
        if (word.startsWith('~') || word.startsWith('on')) {
            const triggerName = word.replace('~', '');
            if (this.knowledgeBase.triggers[triggerName]) {
                return {
                    type: 'trigger',
                    data: {
                        name: triggerName,
                        description: this.knowledgeBase.triggers[triggerName]
                    }
                };
            }
        }
        
        // Check if it's an attribute
        if (this.knowledgeBase.attributes[word]) {
            return {
                type: 'attribute',
                data: {
                    name: word,
                    description: this.knowledgeBase.attributes[word]
                }
            };
        }
        
        return null;
    }

    /**
     * Schedule tooltip show
     */
    scheduleShow(info, x, y) {
        if (this.currentTarget === info.data.name) return;
        
        this.clearTimeouts();
        
        this.showTimeout = setTimeout(() => {
            this.showTooltip(info, x, y);
            this.currentTarget = info.data.name;
        }, this.showDelay);
    }

    /**
     * Schedule tooltip hide
     */
    scheduleHide() {
        this.clearTimeouts();
        
        this.hideTimeout = setTimeout(() => {
            this.hideTooltip();
        }, this.hideDelay);
    }

    /**
     * Clear all timeouts
     */
    clearTimeouts() {
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
            this.showTimeout = null;
        }
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
    }

    /**
     * Show tooltip
     */
    showTooltip(info, x, y) {
        this.hideTooltip();
        
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'context-tooltip';
        this.tooltip.innerHTML = this.renderTooltipContent(info);
        
        document.body.appendChild(this.tooltip);
        
        // Position tooltip
        this.positionTooltip(x, y);
        
        // Add hover handlers to keep tooltip visible
        this.tooltip.addEventListener('mouseenter', () => {
            this.clearTimeouts();
        });
        
        this.tooltip.addEventListener('mouseleave', () => {
            if (!this.isPinned) {
                this.scheduleHide();
            }
        });
    }

    /**
     * Render tooltip content
     */
    renderTooltipContent(info) {
        const { type, data } = info;
        
        const typeIcons = {
            'mechanic': '⚙️',
            'targeter': '🎯',
            'trigger': '⚡',
            'condition': '❓',
            'attribute': '🔧'
        };
        
        let html = `
            <div class="tooltip-header">
                <span class="tooltip-icon">${typeIcons[type] || '📖'}</span>
                <span class="tooltip-title">${data.name || data.title || 'Info'}</span>
                <span class="tooltip-type">${type}</span>
            </div>
            <div class="tooltip-body">
                <p class="tooltip-description">${data.description}</p>
        `;
        
        // Add parameters if available
        if (data.params && Object.keys(data.params).length > 0) {
            html += '<div class="tooltip-params"><strong>Parameters:</strong><ul>';
            for (const [param, desc] of Object.entries(data.params)) {
                html += `<li><code>${param}</code> - ${desc}</li>`;
            }
            html += '</ul></div>';
        }
        
        // Add example if available
        if (data.example) {
            html += `
                <div class="tooltip-example">
                    <strong>Example:</strong>
                    <code>${this.escapeHtml(data.example)}</code>
                </div>
            `;
        }
        
        // Add aliases if available
        if (data.aliases && data.aliases.length > 0) {
            html += `
                <div class="tooltip-aliases">
                    <strong>Aliases:</strong> ${data.aliases.map(a => `<code>${a}</code>`).join(', ')}
                </div>
            `;
        }
        
        html += `
            </div>
            <div class="tooltip-footer">
                <span class="tooltip-hint">Ctrl+Click to pin</span>
            </div>
        `;
        
        return html;
    }

    /**
     * Position tooltip
     */
    positionTooltip(x, y) {
        const rect = this.tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left = x + 15;
        let top = y + 15;
        
        // Adjust if too far right
        if (left + rect.width > viewportWidth - 20) {
            left = x - rect.width - 15;
        }
        
        // Adjust if too far down
        if (top + rect.height > viewportHeight - 20) {
            top = y - rect.height - 15;
        }
        
        // Keep within bounds
        left = Math.max(20, Math.min(left, viewportWidth - rect.width - 20));
        top = Math.max(20, Math.min(top, viewportHeight - rect.height - 20));
        
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        if (this.tooltip && !this.isPinned) {
            this.tooltip.remove();
            this.tooltip = null;
            this.currentTarget = null;
        }
    }

    /**
     * Toggle pin state
     */
    togglePin() {
        this.isPinned = !this.isPinned;
        
        if (this.tooltip) {
            if (this.isPinned) {
                this.tooltip.classList.add('pinned');
            } else {
                this.tooltip.classList.remove('pinned');
                this.hideTooltip();
            }
        }
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillLineTooltip;
}

// Loaded silently
