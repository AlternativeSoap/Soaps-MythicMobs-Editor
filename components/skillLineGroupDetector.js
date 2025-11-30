/**
 * Skill Line Group Detector
 * Automatically detects and groups related skill lines
 * Recognizes patterns like projectiles with callbacks, auras, chains, etc.
 */

class SkillLineGroupDetector {
    constructor() {
        // Callback attributes that create relationships
        this.callbackAttributes = [
            'onTick', 'onHit', 'onEnd', 'onStart', 'onBounce',
            'onTimer', 'onAttack', 'onDamaged', 'onDeath',
            'skill', 's', 'meta', 'm', 'mechanics', '$', '()'
        ];
        
        // Mechanics that commonly use callbacks
        this.callbackMechanics = [
            'projectile', 'missile', 'orbital', 'aura', 'beam', 'totem',
            'ondamaged', 'onattack', 'cast', 'chain', 'raytrace'
        ];
    }

    /**
     * Detect groups in a list of skill lines
     * @param {Array<string>} skillLines - Array of skill line strings
     * @returns {Array<Object>} Array of group objects
     */
    detectGroups(skillLines) {
        const groups = [];
        const processed = new Set();
        
        skillLines.forEach((line, index) => {
            if (processed.has(index)) return;
            
            const parsed = SkillLineParser.parse(line);
            const callbacks = this.extractCallbacks(parsed);
            
            if (callbacks.length > 0) {
                // Find related skill lines
                const group = this.findRelatedLines(skillLines, index, callbacks, processed);
                
                if (group.members.length > 1) {
                    groups.push(group);
                    group.members.forEach(idx => processed.add(idx));
                }
            }
        });
        
        return groups;
    }

    /**
     * Extract callback references from a parsed skill line
     */
    extractCallbacks(parsed) {
        const callbacks = [];
        
        if (!parsed.mechanic || !parsed.mechanicArgs) return callbacks;
        
        // Check if this is a callback mechanic
        const isCallbackMechanic = this.callbackMechanics.some(m => 
            parsed.mechanic.toLowerCase() === m.toLowerCase()
        );
        
        if (!isCallbackMechanic) return callbacks;
        
        // Extract callback skill names from arguments
        for (const [key, value] of Object.entries(parsed.mechanicArgs)) {
            if (this.callbackAttributes.some(attr => 
                key.toLowerCase() === attr.toLowerCase()
            )) {
                callbacks.push({
                    type: key,
                    skillName: value
                });
            }
        }
        
        return callbacks;
    }

    /**
     * Find all skill lines related to the parent line
     */
    findRelatedLines(skillLines, parentIndex, callbacks, processed) {
        const group = {
            type: this.determineGroupType(skillLines[parentIndex]),
            parentIndex: parentIndex,
            members: [parentIndex],
            callbacks: [],
            suggestions: []
        };
        
        // Find each callback skill
        callbacks.forEach(callback => {
            const found = this.findSkillByName(skillLines, callback.skillName, processed);
            if (found !== -1 && found !== parentIndex) {
                group.members.push(found);
                group.callbacks.push({
                    type: callback.type,
                    parentIndex: parentIndex,
                    childIndex: found,
                    skillName: callback.skillName
                });
            } else if (found === -1) {
                // Callback references non-existent skill - suggest creation
                group.suggestions.push({
                    type: 'missing_callback',
                    callbackType: callback.type,
                    skillName: callback.skillName,
                    message: `Create missing callback skill: ${callback.skillName}`
                });
            }
        });
        
        // Sort members to maintain order
        group.members.sort((a, b) => a - b);
        
        return group;
    }

    /**
     * Determine group type from parent mechanic
     */
    determineGroupType(line) {
        const parsed = SkillLineParser.parse(line);
        if (!parsed.mechanic) return 'unknown';
        
        const mechanic = parsed.mechanic.toLowerCase();
        
        const typeMap = {
            'projectile': 'projectile',
            'missile': 'projectile',
            'beam': 'projectile',
            'totem': 'projectile',
            'orbital': 'aura',
            'aura': 'aura',
            'buff': 'aura',
            'debuff': 'aura',
            'ondamaged': 'reactive',
            'onattack': 'reactive',
            'chain': 'chain',
            'cast': 'cast'
        };
        
        return typeMap[mechanic] || 'callback';
    }

    /**
     * Find a skill line that looks like a skill definition
     */
    findSkillByName(skillLines, skillName, processed) {
        // This is simplified - in real YAML, skills are separate sections
        // In our skill line editor, we just look for lines without triggers
        // that might be standalone metaskills
        
        // For now, we can't reliably detect this from single skill lines
        // This would require full file context
        return -1;
    }

    /**
     * Get group icon based on type
     */
    getGroupIcon(type) {
        const icons = {
            'projectile': '🎯',
            'aura': '🔮',
            'reactive': '⚡',
            'chain': '🔗',
            'cast': '✨',
            'callback': '📦',
            'unknown': '❓'
        };
        return icons[type] || icons.unknown;
    }

    /**
     * Get group label based on type
     */
    getGroupLabel(type) {
        const labels = {
            'projectile': 'Projectile Skill',
            'aura': 'Aura Skill',
            'reactive': 'Reactive Skill',
            'chain': 'Chain Skill',
            'cast': 'Cast Skill',
            'callback': 'Callback Group',
            'unknown': 'Skill Group'
        };
        return labels[type] || labels.unknown;
    }

    /**
     * Get suggestions for improving a group
     */
    getGroupSuggestions(group, skillLines) {
        const suggestions = [...group.suggestions];
        const parsed = SkillLineParser.parse(skillLines[group.parentIndex]);
        
        // Check for common missing callbacks
        if (parsed.mechanic) {
            const mechanic = parsed.mechanic.toLowerCase();
            
            // Projectile suggestions
            if (mechanic === 'projectile' || mechanic === 'missile') {
                const hasOnTick = group.callbacks.some(c => c.type.toLowerCase() === 'ontick');
                const hasOnHit = group.callbacks.some(c => c.type.toLowerCase() === 'onhit');
                const hasOnEnd = group.callbacks.some(c => c.type.toLowerCase() === 'onend');
                
                if (!hasOnTick) {
                    suggestions.push({
                        type: 'optional_callback',
                        callbackType: 'onTick',
                        message: 'Consider adding onTick for particle trail',
                        template: '  - effect:particles{p=flame;a=10} @origin'
                    });
                }
                
                if (!hasOnHit) {
                    suggestions.push({
                        type: 'recommended_callback',
                        callbackType: 'onHit',
                        message: 'Add onHit callback for impact effect',
                        template: '  - damage{a=10} @target'
                    });
                }
                
                if (!hasOnEnd) {
                    suggestions.push({
                        type: 'optional_callback',
                        callbackType: 'onEnd',
                        message: 'Consider adding onEnd for timeout effect',
                        template: '  - effect:explosion @origin'
                    });
                }
            }
            
            // Aura suggestions
            if (mechanic === 'aura' || mechanic === 'buff' || mechanic === 'debuff') {
                const hasOnStart = group.callbacks.some(c => c.type.toLowerCase() === 'onstart');
                const hasOnTick = group.callbacks.some(c => c.type.toLowerCase() === 'ontick');
                const hasOnEnd = group.callbacks.some(c => c.type.toLowerCase() === 'onend');
                
                if (!hasOnStart && !hasOnTick && !hasOnEnd) {
                    suggestions.push({
                        type: 'recommended_callback',
                        callbackType: 'onTick',
                        message: 'Aura needs at least one callback (onStart/onTick/onEnd)',
                        template: '  - potion{type=SPEED;duration=100;level=1} @self'
                    });
                }
            }
        }
        
        return suggestions;
    }

    /**
     * Generate YAML comment header for group
     */
    generateGroupComment(group, skillLines) {
        const label = this.getGroupLabel(group.type);
        const icon = this.getGroupIcon(group.type);
        const parsed = SkillLineParser.parse(skillLines[group.parentIndex]);
        
        return `# ${icon} ${label}: ${parsed.mechanic || 'Unknown'}`;
    }

    /**
     * Check if a skill line is part of any group
     */
    isInGroup(index, groups) {
        return groups.some(group => group.members.includes(index));
    }

    /**
     * Get group that contains a specific skill line
     */
    getGroupForLine(index, groups) {
        return groups.find(group => group.members.includes(index));
    }

    /**
     * Analyze all groups and return statistics
     */
    analyzeGroups(groups, skillLines) {
        return {
            totalGroups: groups.length,
            groupTypes: this.countGroupTypes(groups),
            totalMembers: groups.reduce((sum, g) => sum + g.members.length, 0),
            totalSuggestions: groups.reduce((sum, g) => sum + g.suggestions.length, 0),
            missingCallbacks: groups.filter(g => 
                g.suggestions.some(s => s.type === 'missing_callback')
            ).length,
            groupedLines: new Set(groups.flatMap(g => g.members)).size,
            ungroupedLines: skillLines.length - new Set(groups.flatMap(g => g.members)).size
        };
    }

    /**
     * Count group types
     */
    countGroupTypes(groups) {
        const counts = {};
        groups.forEach(group => {
            counts[group.type] = (counts[group.type] || 0) + 1;
        });
        return counts;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillLineGroupDetector;
}

console.log('✅ SkillLineGroupDetector loaded');
