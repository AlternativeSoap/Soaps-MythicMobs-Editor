/**
 * Skill Pattern Analyzer
 * Detects common patterns, anti-patterns, and suggests optimizations
 * Provides intelligent feedback on skill line composition
 */

class SkillPatternAnalyzer {
    constructor() {
        // Pattern definitions
        this.patterns = {
            // Positive patterns (good practices)
            damageCombo: {
                name: 'Damage Combo',
                description: 'Coordinated damage sequence with effects',
                detect: (lines) => this.detectDamageCombo(lines),
                severity: 'info',
                icon: '⚔️'
            },
            buffSequence: {
                name: 'Buff Sequence',
                description: 'Well-structured buff application',
                detect: (lines) => this.detectBuffSequence(lines),
                severity: 'info',
                icon: '✨'
            },
            projectileChain: {
                name: 'Projectile Chain',
                description: 'Projectile with proper callbacks',
                detect: (lines) => this.detectProjectileChain(lines),
                severity: 'info',
                icon: '🎯'
            },
            
            // Anti-patterns (issues to fix)
            missingCooldown: {
                name: 'Missing Cooldown',
                description: 'Repeated mechanics without cooldown may cause spam',
                detect: (lines) => this.detectMissingCooldown(lines),
                severity: 'warning',
                icon: '⏱️'
            },
            inefficientTargeting: {
                name: 'Inefficient Targeting',
                description: 'Multiple mechanics targeting the same entity separately',
                detect: (lines) => this.detectInefficientTargeting(lines),
                severity: 'warning',
                icon: '🎯'
            },
            redundantConditions: {
                name: 'Redundant Conditions',
                description: 'Duplicate or contradictory conditions',
                detect: (lines) => this.detectRedundantConditions(lines),
                severity: 'warning',
                icon: '❓'
            },
            unbalancedDamage: {
                name: 'Unbalanced Damage',
                description: 'Damage values may be too high or too low',
                detect: (lines) => this.detectUnbalancedDamage(lines),
                severity: 'info',
                icon: '⚠️'
            },
            missingCallback: {
                name: 'Missing Callback',
                description: 'Projectile/aura without callback mechanics',
                detect: (lines) => this.detectMissingCallback(lines),
                severity: 'error',
                icon: '🔗'
            },
            particleOverload: {
                name: 'Particle Overload',
                description: 'Too many particle effects may cause lag',
                detect: (lines) => this.detectParticleOverload(lines),
                severity: 'warning',
                icon: '💥'
            }
        };
        
        // Tips and suggestions (helpful hints)
        this.tips = {
            velocityTip: {
                name: 'Velocity Tip',
                description: 'Projectiles can use high velocity for instant effects',
                detect: (lines) => this.detectVelocityTip(lines),
                severity: 'tip',
                icon: '🚀'
            },
            alternativeMechanic: {
                name: 'Alternative Mechanic',
                description: 'There may be a better mechanic for this use case',
                detect: (lines) => this.detectAlternativeMechanic(lines),
                severity: 'tip',
                icon: '💡'
            },
            raytraceTip: {
                name: 'Raytrace Tip',
                description: 'Use raytrace for instant line-based effects',
                detect: (lines) => this.detectRaytraceTip(lines),
                severity: 'tip',
                icon: '📏'
            },
            sudoTip: {
                name: 'Sudo Mechanic',
                description: 'Run skills from target perspective with sudo',
                detect: (lines) => this.detectSudoTip(lines),
                severity: 'tip',
                icon: '🔄'
            },
            variableTip: {
                name: 'Variable Tip',
                description: 'Use variables for dynamic values',
                detect: (lines) => this.detectVariableTip(lines),
                severity: 'tip',
                icon: '📊'
            },
            modifyTargetTip: {
                name: 'Modify Target Tip',
                description: 'ModifyTargetLocation can offset targets',
                detect: (lines) => this.detectModifyTargetTip(lines),
                severity: 'tip',
                icon: '📍'
            }
        };

        // Thresholds for detection
        this.thresholds = {
            highDamage: 50,
            lowDamage: 2,
            maxParticles: 5,
            similarityThreshold: 0.7
        };
    }

    /**
     * Analyze skill lines and return all findings
     */
    analyze(skillLines) {
        if (!skillLines || skillLines.length === 0) {
            return {
                patterns: [],
                antiPatterns: [],
                tips: [],
                summary: {
                    totalLines: 0,
                    issues: 0,
                    tips: 0
                }
            };
        }

        const findings = {
            patterns: [],
            antiPatterns: [],
            tips: [],
            summary: {
                totalLines: skillLines.length,
                issues: 0,
                tips: 0
            }
        };

        // Parse all lines once
        const parsedLines = skillLines.map((line, index) => ({
            index,
            line,
            parsed: SkillLineParser.parse(line)
        }));

        // Detect patterns
        for (const [key, pattern] of Object.entries(this.patterns)) {
            const results = pattern.detect(parsedLines);
            if (results && results.length > 0) {
                results.forEach(result => {
                    const finding = {
                        type: key,
                        name: pattern.name,
                        description: pattern.description,
                        severity: pattern.severity,
                        icon: pattern.icon,
                        ...result
                    };
                    
                    if (pattern.severity === 'error' || pattern.severity === 'warning') {
                        findings.antiPatterns.push(finding);
                        findings.summary.issues++;
                    } else {
                        findings.patterns.push(finding);
                    }
                });
            }
        }

        // Detect tips and suggestions
        for (const [key, tip] of Object.entries(this.tips)) {
            const results = tip.detect(parsedLines);
            if (results && results.length > 0) {
                results.forEach(result => {
                    findings.tips.push({
                        type: key,
                        name: tip.name,
                        description: tip.description,
                        severity: tip.severity,
                        icon: tip.icon,
                        ...result
                    });
                    findings.summary.tips++;
                });
            }
        }

        return findings;
    }

    /**
     * PATTERN DETECTORS
     */

    detectDamageCombo(parsedLines) {
        const findings = [];
        const damageLines = parsedLines.filter(pl => 
            pl.parsed.mechanic && 
            (pl.parsed.mechanic.toLowerCase().includes('damage') || 
             pl.parsed.mechanic.toLowerCase() === 'basedamage')
        );

        if (damageLines.length >= 2) {
            // Check if damage is followed by effects
            damageLines.forEach(damageLine => {
                const nextLines = parsedLines.slice(damageLine.index + 1, damageLine.index + 4);
                const hasEffects = nextLines.some(pl => 
                    pl.parsed.mechanic && 
                    (pl.parsed.mechanic.toLowerCase().includes('particle') ||
                     pl.parsed.mechanic.toLowerCase().includes('sound') ||
                     pl.parsed.mechanic.toLowerCase().includes('effect'))
                );

                if (hasEffects) {
                    findings.push({
                        lineIndices: [damageLine.index],
                        message: 'Damage combo with visual/audio effects',
                        suggestion: 'Well-structured damage sequence'
                    });
                }
            });
        }

        return findings;
    }

    detectBuffSequence(parsedLines) {
        const findings = [];
        const buffMechanics = ['potion', 'addtag', 'setskillcooldown', 'modifyattribute'];
        
        const buffLines = parsedLines.filter(pl => 
            pl.parsed.mechanic && 
            buffMechanics.some(buff => pl.parsed.mechanic.toLowerCase().includes(buff))
        );

        if (buffLines.length >= 2) {
            findings.push({
                lineIndices: buffLines.map(bl => bl.index),
                message: `Buff sequence detected (${buffLines.length} buffs)`,
                suggestion: 'Consider adding duration checks or cooldowns'
            });
        }

        return findings;
    }

    detectProjectileChain(parsedLines) {
        const findings = [];
        const projectileLines = parsedLines.filter(pl => 
            pl.parsed.mechanic && 
            (pl.parsed.mechanic.toLowerCase().includes('projectile') ||
             pl.parsed.mechanic.toLowerCase().includes('missile'))
        );

        projectileLines.forEach(projLine => {
            const hasCallback = projLine.parsed.mechanicArgs && 
                (projLine.parsed.mechanicArgs.onTick || 
                 projLine.parsed.mechanicArgs.onHit || 
                 projLine.parsed.mechanicArgs.onEnd);

            if (hasCallback) {
                findings.push({
                    lineIndices: [projLine.index],
                    message: 'Projectile with callbacks',
                    suggestion: 'Ensure callback skills exist and are properly defined'
                });
            }
        });

        return findings;
    }

    detectMissingCooldown(parsedLines) {
        const findings = [];
        const spammableMechanics = ['damage', 'heal', 'teleport', 'pull', 'push'];
        
        const spammableLines = parsedLines.filter(pl => 
            pl.parsed.mechanic && 
            spammableMechanics.some(spam => pl.parsed.mechanic.toLowerCase().includes(spam))
        );

        spammableLines.forEach(line => {
            const hasCooldown = line.parsed.mechanicArgs && 
                (line.parsed.mechanicArgs.cooldown || line.parsed.mechanicArgs.cd);
            
            if (!hasCooldown && spammableLines.length > 1) {
                findings.push({
                    lineIndices: [line.index],
                    message: 'Potentially spammable mechanic without cooldown',
                    suggestion: 'Add cooldown or use skill-level cooldown'
                });
            }
        });

        return findings;
    }

    detectInefficientTargeting(parsedLines) {
        const findings = [];
        const targetGroups = {};

        // Group by targeter
        parsedLines.forEach(pl => {
            if (pl.parsed.targeter) {
                const key = pl.parsed.targeter.toLowerCase();
                if (!targetGroups[key]) {
                    targetGroups[key] = [];
                }
                targetGroups[key].push(pl);
            }
        });

        // Find groups with 3+ mechanics on same target
        for (const [targeter, lines] of Object.entries(targetGroups)) {
            if (lines.length >= 3) {
                findings.push({
                    lineIndices: lines.map(l => l.index),
                    message: `${lines.length} mechanics targeting ${targeter}`,
                    suggestion: 'Consider using a metaskill or chain mechanic'
                });
            }
        }

        return findings;
    }

    detectRedundantConditions(parsedLines) {
        const findings = [];
        const conditionMap = {};

        parsedLines.forEach(pl => {
            if (pl.parsed.conditions && pl.parsed.conditions.length > 0) {
                const conditions = pl.parsed.conditions;
                const conditionKey = conditions.map(c => typeof c === 'string' ? c.toLowerCase() : String(c).toLowerCase()).sort().join('|');
                
                if (conditionMap[conditionKey]) {
                    conditionMap[conditionKey].push(pl.index);
                } else {
                    conditionMap[conditionKey] = [pl.index];
                }
            }
        });

        // Find duplicate conditions
        for (const [conditions, indices] of Object.entries(conditionMap)) {
            if (indices.length > 1) {
                findings.push({
                    lineIndices: indices,
                    message: 'Multiple lines with identical conditions',
                    suggestion: 'Consider combining these mechanics or using a metaskill'
                });
            }
        }

        return findings;
    }

    detectUnbalancedDamage(parsedLines) {
        const findings = [];
        
        parsedLines.forEach(pl => {
            if (pl.parsed.mechanic && pl.parsed.mechanic.toLowerCase().includes('damage')) {
                const amount = pl.parsed.mechanicArgs?.a || 
                              pl.parsed.mechanicArgs?.amount || 
                              pl.parsed.mechanicArgs?.damage;
                
                if (amount) {
                    const dmg = parseFloat(amount);
                    if (!isNaN(dmg)) {
                        if (dmg > this.thresholds.highDamage) {
                            findings.push({
                                lineIndices: [pl.index],
                                message: `High damage value: ${dmg}`,
                                suggestion: 'Consider if this damage is intentional for balance'
                            });
                        } else if (dmg < this.thresholds.lowDamage) {
                            findings.push({
                                lineIndices: [pl.index],
                                message: `Low damage value: ${dmg}`,
                                suggestion: 'This may be too weak to be effective'
                            });
                        }
                    }
                }
            }
        });

        return findings;
    }

    detectMissingCallback(parsedLines) {
        const findings = [];
        const callbackMechanics = ['projectile', 'missile', 'aura', 'orbital', 'totem'];
        
        parsedLines.forEach(pl => {
            if (pl.parsed.mechanic && 
                callbackMechanics.some(cb => pl.parsed.mechanic.toLowerCase().includes(cb))) {
                
                const hasCallback = pl.parsed.mechanicArgs && 
                    (pl.parsed.mechanicArgs.onTick || 
                     pl.parsed.mechanicArgs.onHit || 
                     pl.parsed.mechanicArgs.onEnd ||
                     pl.parsed.mechanicArgs.onStart);

                if (!hasCallback) {
                    findings.push({
                        lineIndices: [pl.index],
                        message: `${pl.parsed.mechanic} without callback`,
                        suggestion: 'Add onTick, onHit, or onEnd callback for functionality'
                    });
                }
            }
        });

        return findings;
    }

    detectParticleOverload(parsedLines) {
        const findings = [];
        const particleLines = parsedLines.filter(pl => 
            pl.parsed.mechanic && 
            (pl.parsed.mechanic.toLowerCase().includes('particle') ||
             pl.parsed.mechanic.toLowerCase().includes('effect:particle'))
        );

        if (particleLines.length > this.thresholds.maxParticles) {
            findings.push({
                lineIndices: particleLines.map(pl => pl.index),
                message: `${particleLines.length} particle effects detected`,
                suggestion: 'Too many particles may cause client lag. Consider reducing or using intervals'
            });
        }

        return findings;
    }

    /**
     * TIP DETECTORS - Helpful suggestions for better skill building
     */

    detectVelocityTip(parsedLines) {
        const findings = [];
        const projectileLines = parsedLines.filter(pl => 
            pl.parsed.mechanic && 
            (pl.parsed.mechanic.toLowerCase().includes('projectile') ||
             pl.parsed.mechanic.toLowerCase().includes('missile'))
        );

        projectileLines.forEach(pl => {
            const velocity = pl.parsed.mechanicArgs?.velocity || pl.parsed.mechanicArgs?.v;
            if (!velocity || parseFloat(velocity) < 5) {
                findings.push({
                    lineIndices: [pl.index],
                    message: 'Projectile with low/default velocity',
                    suggestion: 'Use high velocity (v=50+) for instant hit effects, or v=0 for stationary orbitals'
                });
            }
        });

        return findings;
    }

    detectAlternativeMechanic(parsedLines) {
        const findings = [];
        const alternatives = {
            'teleport': { alt: 'teleportto', tip: 'Use teleportto for teleporting to specific locations or entities' },
            'pull': { alt: 'velocity', tip: 'Use velocity mechanic for more precise pull/push with vx, vy, vz control' },
            'push': { alt: 'velocity', tip: 'Use velocity mechanic for more precise push effects with vx, vy, vz control' },
            'lightning': { alt: 'lightningeffect', tip: 'Use effect:lightning for visual-only lightning (no damage)' },
            'particles': { alt: 'particleline/ring/sphere', tip: 'Use particleline, particlering, or particlesphere for shaped effects' }
        };

        parsedLines.forEach(pl => {
            if (pl.parsed.mechanic) {
                const mech = pl.parsed.mechanic.toLowerCase();
                for (const [key, info] of Object.entries(alternatives)) {
                    if (mech === key) {
                        findings.push({
                            lineIndices: [pl.index],
                            message: `Alternative to ${key} mechanic`,
                            suggestion: info.tip
                        });
                    }
                }
            }
        });

        return findings;
    }

    detectRaytraceTip(parsedLines) {
        const findings = [];
        
        // Check for damage mechanics without targeting
        const damageLines = parsedLines.filter(pl => 
            pl.parsed.mechanic && 
            pl.parsed.mechanic.toLowerCase().includes('damage') &&
            pl.parsed.targeter &&
            pl.parsed.targeter.toLowerCase().includes('forward')
        );

        if (damageLines.length > 0) {
            findings.push({
                lineIndices: damageLines.map(dl => dl.index),
                message: 'Forward-targeting damage detected',
                suggestion: 'Consider raytrace mechanic for instant line-of-sight damage with precise targeting'
            });
        }

        return findings;
    }

    detectSudoTip(parsedLines) {
        const findings = [];
        
        // Look for skills targeting others that might benefit from sudo
        const skillLines = parsedLines.filter(pl => 
            pl.parsed.mechanic && 
            pl.parsed.mechanic.toLowerCase() === 'skill' &&
            pl.parsed.targeter &&
            !pl.parsed.targeter.toLowerCase().includes('self')
        );

        if (skillLines.length >= 2) {
            findings.push({
                lineIndices: [skillLines[0].index],
                message: 'Skills targeting other entities',
                suggestion: 'Use sudoskill to run a skill from the target\'s perspective (they become the caster)'
            });
        }

        return findings;
    }

    detectVariableTip(parsedLines) {
        const findings = [];
        
        // Look for hardcoded repeated values
        const values = {};
        parsedLines.forEach(pl => {
            if (pl.parsed.mechanicArgs) {
                for (const [key, val] of Object.entries(pl.parsed.mechanicArgs)) {
                    if (typeof val === 'string' && !val.includes('<') && !isNaN(parseFloat(val))) {
                        const numVal = parseFloat(val);
                        if (numVal > 1) {
                            if (!values[val]) values[val] = [];
                            values[val].push(pl.index);
                        }
                    }
                }
            }
        });

        // Find repeated values
        for (const [val, indices] of Object.entries(values)) {
            if (indices.length >= 3) {
                findings.push({
                    lineIndices: [...new Set(indices)],
                    message: `Value "${val}" appears ${indices.length} times`,
                    suggestion: 'Use variables like <caster.var.myValue> for dynamic and reusable values'
                });
                break; // Only one tip
            }
        }

        return findings;
    }

    detectModifyTargetTip(parsedLines) {
        const findings = [];
        
        // Look for ground-level effects that might need height adjustment
        const groundEffects = parsedLines.filter(pl => 
            pl.parsed.mechanic && 
            (pl.parsed.mechanic.toLowerCase().includes('particle') ||
             pl.parsed.mechanic.toLowerCase().includes('effect')) &&
            pl.parsed.targeter &&
            (pl.parsed.targeter.toLowerCase().includes('location') ||
             pl.parsed.targeter.toLowerCase().includes('origin'))
        );

        if (groundEffects.length > 0) {
            findings.push({
                lineIndices: [groundEffects[0].index],
                message: 'Location-based effects detected',
                suggestion: 'Use modifytargetlocation{y=1} to adjust effect height above ground'
            });
        }

        return findings;
    }

    /**
     * Get summary statistics
     */
    getSummary(analysis) {
        return {
            totalLines: analysis.summary.totalLines,
            patterns: analysis.patterns.length,
            issues: analysis.summary.issues,
            tips: analysis.tips ? analysis.tips.length : 0,
            severity: {
                error: analysis.antiPatterns.filter(ap => ap.severity === 'error').length,
                warning: analysis.antiPatterns.filter(ap => ap.severity === 'warning').length,
                info: analysis.antiPatterns.filter(ap => ap.severity === 'info').length
            }
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillPatternAnalyzer;
}

// Loaded silently
