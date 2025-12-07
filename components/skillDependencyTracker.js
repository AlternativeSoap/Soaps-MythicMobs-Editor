/**
 * Skill Dependency Tracker
 * Tracks skill references, callbacks, and dependencies
 * Detects missing skills, circular dependencies, and unused skills
 */

class SkillDependencyTracker {
    constructor() {
        this.dependencies = new Map(); // skillName -> Set of referenced skills
        this.usages = new Map(); // skillName -> Set of skills that use it
        this.issues = [];
        this.externalReferences = new Set(); // Skills referenced by mobs
    }

    /**
     * Analyze all skills and build dependency graph
     * @param {Object} skillsData - Either flat array (mob) or skills object (skill file)
     * @param {string} context - 'mob' or 'skill'
     * @param {Set} externalRefs - Optional set of skill names referenced externally (e.g., by mobs)
     */
    analyze(skillsData, context = 'skill', externalRefs = null) {
        this.dependencies.clear();
        this.usages.clear();
        this.issues = [];
        this.externalReferences = externalRefs || new Set();

        let allSkills = {};
        
        if (context === 'mob') {
            // Mob context: treat as single unnamed skill
            allSkills['_mob_skills'] = skillsData;
        } else {
            // Skill context: skills is an object with multiple named skills
            allSkills = skillsData;
        }

        // First pass: extract all skill names
        const skillNames = new Set(Object.keys(allSkills));

        // Second pass: analyze each skill for dependencies
        for (const [skillName, skillData] of Object.entries(allSkills)) {
            const lines = Array.isArray(skillData) ? skillData : (skillData.lines || []);
            const deps = this.extractDependencies(lines);
            
            this.dependencies.set(skillName, deps);
            
            // Build reverse map (usages)
            deps.forEach(dep => {
                if (!this.usages.has(dep)) {
                    this.usages.set(dep, new Set());
                }
                this.usages.get(dep).add(skillName);
            });
        }

        // Third pass: detect issues
        this.detectMissingSkills(skillNames);
        this.detectCircularDependencies();
        this.detectUnusedSkills(skillNames, context);

        return {
            dependencies: this.getDependencyTree(),
            usages: this.getUsageTree(),
            issues: this.issues,
            summary: {
                totalSkills: skillNames.size,
                totalDependencies: Array.from(this.dependencies.values()).reduce((sum, deps) => sum + deps.size, 0),
                missingSkills: this.issues.filter(i => i.type === 'missing').length,
                circularDeps: this.issues.filter(i => i.type === 'circular').length,
                unusedSkills: this.issues.filter(i => i.type === 'unused').length
            }
        };
    }

    /**
     * Extract skill dependencies from skill lines
     */
    extractDependencies(lines) {
        const deps = new Set();
        
        lines.forEach(line => {
            const parsed = SkillLineParser.parse(line);
            
            // Check mechanic arguments for skill references
            if (parsed.mechanicArgs) {
                // Common callback attributes
                const callbackAttrs = [
                    'onTick', 'onHit', 'onEnd', 'onStart', 'onBounce', 'onTimer',
                    'skill', 's', 'meta', 'm', 'mechanics', 'onAttack', 'onDamaged'
                ];
                
                callbackAttrs.forEach(attr => {
                    if (parsed.mechanicArgs[attr]) {
                        deps.add(parsed.mechanicArgs[attr]);
                    }
                });
            }
            
            // Check for skill mechanic itself
            if (parsed.mechanic && parsed.mechanic.toLowerCase() === 'skill') {
                if (parsed.mechanicArgs?.s || parsed.mechanicArgs?.skill) {
                    deps.add(parsed.mechanicArgs.s || parsed.mechanicArgs.skill);
                }
            }
            
            // Check for metaskill references
            if (parsed.mechanic && (parsed.mechanic.toLowerCase() === 'metaskill' || parsed.mechanic.toLowerCase() === 'meta')) {
                if (parsed.mechanicArgs?.skill || parsed.mechanicArgs?.s) {
                    deps.add(parsed.mechanicArgs.skill || parsed.mechanicArgs.s);
                }
            }
        });
        
        return deps;
    }

    /**
     * Detect missing skill references
     */
    detectMissingSkills(availableSkills) {
        for (const [skillName, deps] of this.dependencies.entries()) {
            deps.forEach(dep => {
                // Skip internal/special skills that might be defined elsewhere
                if (dep.startsWith('_') || dep.includes(':')) return;
                
                if (!availableSkills.has(dep)) {
                    this.issues.push({
                        type: 'missing',
                        severity: 'error',
                        skillName: skillName,
                        missingSkill: dep,
                        message: `Skill "${skillName}" references missing skill "${dep}"`,
                        suggestion: `Create the skill "${dep}" or fix the reference`
                    });
                }
            });
        }
    }

    /**
     * Detect circular dependencies
     */
    detectCircularDependencies() {
        const visited = new Set();
        const recursionStack = new Set();
        
        const dfs = (skill, path = []) => {
            if (recursionStack.has(skill)) {
                // Found a cycle
                const cycleStart = path.indexOf(skill);
                const cycle = [...path.slice(cycleStart), skill];
                
                this.issues.push({
                    type: 'circular',
                    severity: 'error',
                    cycle: cycle,
                    message: `Circular dependency detected: ${cycle.join(' → ')}`,
                    suggestion: 'Remove one of the circular references to break the cycle'
                });
                return true;
            }
            
            if (visited.has(skill)) {
                return false;
            }
            
            visited.add(skill);
            recursionStack.add(skill);
            
            const deps = this.dependencies.get(skill) || new Set();
            for (const dep of deps) {
                if (dfs(dep, [...path, skill])) {
                    return true;
                }
            }
            
            recursionStack.delete(skill);
            return false;
        };
        
        for (const skill of this.dependencies.keys()) {
            if (!visited.has(skill)) {
                dfs(skill);
            }
        }
    }

    /**
     * Detect unused skills
     */
    detectUnusedSkills(availableSkills, context) {
        // In mob context, skip unused detection (mob skills are triggered externally)
        if (context === 'mob') return;
        
        for (const skillName of availableSkills) {
            const usedBy = this.usages.get(skillName);
            const deps = this.dependencies.get(skillName);
            
            // A skill is unused if:
            // 1. It's not used by any other skill
            // 2. It's not referenced externally (by mobs)
            // 3. It's not a common entry point pattern (like skill names with "Main", "Start", etc.)
            const isEntryPoint = /^(main|start|init|root|base)/i.test(skillName);
            const isExternallyReferenced = this.externalReferences.has(skillName);
            
            if (!usedBy && !isEntryPoint && !isExternallyReferenced && skillName !== '_mob_skills') {
                this.issues.push({
                    type: 'unused',
                    severity: 'info',
                    skillName: skillName,
                    message: `Skill "${skillName}" appears to be unused`,
                    suggestion: 'This skill is not referenced by any other skill or mob. Remove it if unnecessary, or use it as an entry point.'
                });
            }
        }
    }

    /**
     * Get dependency tree for visualization
     */
    getDependencyTree() {
        const tree = {};
        for (const [skill, deps] of this.dependencies.entries()) {
            tree[skill] = Array.from(deps);
        }
        return tree;
    }

    /**
     * Get usage tree (reverse dependencies)
     */
    getUsageTree() {
        const tree = {};
        for (const [skill, usages] of this.usages.entries()) {
            tree[skill] = Array.from(usages);
        }
        return tree;
    }

    /**
     * Get all dependencies for a specific skill (recursive)
     */
    getAllDependencies(skillName, visited = new Set()) {
        if (visited.has(skillName)) return visited;
        visited.add(skillName);
        
        const deps = this.dependencies.get(skillName) || new Set();
        deps.forEach(dep => {
            this.getAllDependencies(dep, visited);
        });
        
        return visited;
    }

    /**
     * Get all usages for a specific skill (recursive)
     */
    getAllUsages(skillName, visited = new Set()) {
        if (visited.has(skillName)) return visited;
        visited.add(skillName);
        
        const usages = this.usages.get(skillName) || new Set();
        usages.forEach(usage => {
            this.getAllUsages(usage, visited);
        });
        
        return visited;
    }

    /**
     * Generate dependency graph visualization data
     */
    generateGraphData() {
        const nodes = [];
        const edges = [];
        const nodeMap = new Map();
        
        let nodeId = 0;
        
        // Create nodes
        for (const skill of this.dependencies.keys()) {
            const id = nodeId++;
            nodeMap.set(skill, id);
            
            const usages = this.usages.get(skill) || new Set();
            const deps = this.dependencies.get(skill) || new Set();
            
            nodes.push({
                id: id,
                name: skill,
                dependencyCount: deps.size,
                usageCount: usages.size,
                isEntryPoint: usages.size === 0 && deps.size > 0,
                isLeaf: deps.size === 0 && usages.size > 0,
                isIsolated: deps.size === 0 && usages.size === 0
            });
        }
        
        // Create edges
        for (const [skill, deps] of this.dependencies.entries()) {
            const fromId = nodeMap.get(skill);
            deps.forEach(dep => {
                const toId = nodeMap.get(dep);
                if (toId !== undefined) {
                    edges.push({
                        from: fromId,
                        to: toId,
                        fromSkill: skill,
                        toSkill: dep
                    });
                }
            });
        }
        
        return { nodes, edges };
    }

    /**
     * Get dependency path between two skills
     */
    getDependencyPath(fromSkill, toSkill) {
        const queue = [[fromSkill]];
        const visited = new Set([fromSkill]);
        
        while (queue.length > 0) {
            const path = queue.shift();
            const current = path[path.length - 1];
            
            if (current === toSkill) {
                return path;
            }
            
            const deps = this.dependencies.get(current) || new Set();
            for (const dep of deps) {
                if (!visited.has(dep)) {
                    visited.add(dep);
                    queue.push([...path, dep]);
                }
            }
        }
        
        return null; // No path found
    }

    /**
     * Get summary statistics
     */
    getSummary() {
        const allSkills = Array.from(this.dependencies.keys());
        const entryPoints = allSkills.filter(skill => {
            const usages = this.usages.get(skill);
            return !usages || usages.size === 0;
        });
        
        const leafSkills = allSkills.filter(skill => {
            const deps = this.dependencies.get(skill);
            return !deps || deps.size === 0;
        });
        
        const maxDepth = this.calculateMaxDepth();
        
        return {
            totalSkills: allSkills.length,
            entryPoints: entryPoints.length,
            leafSkills: leafSkills.length,
            maxDepth: maxDepth,
            totalEdges: Array.from(this.dependencies.values()).reduce((sum, deps) => sum + deps.size, 0),
            issues: {
                missing: this.issues.filter(i => i.type === 'missing').length,
                circular: this.issues.filter(i => i.type === 'circular').length,
                unused: this.issues.filter(i => i.type === 'unused').length
            }
        };
    }

    /**
     * Calculate maximum dependency depth
     */
    calculateMaxDepth() {
        let maxDepth = 0;
        
        const getDepth = (skill, visited = new Set()) => {
            if (visited.has(skill)) return 0;
            visited.add(skill);
            
            const deps = this.dependencies.get(skill) || new Set();
            if (deps.size === 0) return 0;
            
            let maxChildDepth = 0;
            deps.forEach(dep => {
                const depth = getDepth(dep, new Set(visited));
                maxChildDepth = Math.max(maxChildDepth, depth);
            });
            
            return maxChildDepth + 1;
        };
        
        for (const skill of this.dependencies.keys()) {
            const depth = getDepth(skill);
            maxDepth = Math.max(maxDepth, depth);
        }
        
        return maxDepth;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillDependencyTracker;
}

// Loaded silently
