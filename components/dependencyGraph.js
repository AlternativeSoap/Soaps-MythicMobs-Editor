/**
 * Dependency Graph
 * Analyzes and visualizes dependencies between mobs, skills, items, droptables, and randomspawns
 */

class DependencyGraph {
    constructor(editor) {
        this.editor = editor;
        this.graph = new Map(); // node -> [dependencies]
        this.nodeTypes = new Map(); // node -> type ('mob', 'skill', 'item', etc.)
        this.nodeData = new Map(); // node -> full data object
        this.lastAnalysis = null;
        this.cycles = [];
        this.orphans = [];
    }

    /**
     * Build dependency graph from current pack
     */
    buildGraph(pack) {
        if (!pack) {
            console.warn('No pack provided to build graph');
            return;
        }

        console.log('🔍 Building dependency graph for pack:', pack.name);
        
        this.graph.clear();
        this.nodeTypes.clear();
        this.nodeData.clear();
        this.cycles = [];
        this.orphans = [];

        // Add all nodes first
        this._addSkillNodes(pack);
        this._addMobNodes(pack);
        this._addItemNodes(pack);
        this._addDropTableNodes(pack);
        this._addRandomSpawnNodes(pack);

        // Build edges
        this._buildSkillDependencies(pack);
        this._buildMobDependencies(pack);
        this._buildItemDependencies(pack);
        this._buildDropTableDependencies(pack);
        this._buildRandomSpawnDependencies(pack);

        // Analyze
        this.analyze();
        
        console.log('✅ Graph built:', {
            nodes: this.graph.size,
            cycles: this.cycles.length,
            orphans: this.orphans.length
        });

        return this.getAnalysisResult();
    }

    /**
     * Add skill nodes to graph
     */
    _addSkillNodes(pack) {
        if (!pack.skills) return;
        
        pack.skills.forEach(skill => {
            const name = skill.internalName || skill.name;
            if (name) {
                this.graph.set(name, []);
                this.nodeTypes.set(name, 'skill');
                this.nodeData.set(name, skill);
            }
        });
    }

    /**
     * Add mob nodes to graph
     */
    _addMobNodes(pack) {
        if (!pack.mobs) return;
        
        pack.mobs.forEach(mob => {
            const name = mob.internalName || mob.name;
            if (name) {
                this.graph.set(name, []);
                this.nodeTypes.set(name, 'mob');
                this.nodeData.set(name, mob);
            }
        });
    }

    /**
     * Add item nodes to graph
     */
    _addItemNodes(pack) {
        if (!pack.items) return;
        
        pack.items.forEach(item => {
            const name = item.internalName || item.name;
            if (name) {
                this.graph.set(name, []);
                this.nodeTypes.set(name, 'item');
                this.nodeData.set(name, item);
            }
        });
    }

    /**
     * Add droptable nodes to graph
     */
    _addDropTableNodes(pack) {
        if (!pack.droptables) return;
        
        pack.droptables.forEach(table => {
            const name = table.internalName || table.name;
            if (name) {
                this.graph.set(name, []);
                this.nodeTypes.set(name, 'droptable');
                this.nodeData.set(name, table);
            }
        });
    }

    /**
     * Add randomspawn nodes to graph
     */
    _addRandomSpawnNodes(pack) {
        if (!pack.randomspawns) return;
        
        pack.randomspawns.forEach(spawn => {
            const name = spawn.internalName || spawn.name;
            if (name) {
                this.graph.set(name, []);
                this.nodeTypes.set(name, 'randomspawn');
                this.nodeData.set(name, spawn);
            }
        });
    }

    /**
     * Build skill -> skill dependencies (via @skill{} mechanic)
     */
    _buildSkillDependencies(pack) {
        if (!pack.skills) return;
        
        pack.skills.forEach(skill => {
            const skillName = skill.internalName || skill.name;
            const content = skill.content || '';
            const dependencies = this._extractSkillCalls(content);
            
            dependencies.forEach(dep => {
                if (this.graph.has(dep)) {
                    const existing = this.graph.get(skillName) || [];
                    if (!existing.includes(dep)) {
                        existing.push(dep);
                        this.graph.set(skillName, existing);
                    }
                }
            });
        });
    }

    /**
     * Build mob -> skill dependencies (via Skills: list)
     */
    _buildMobDependencies(pack) {
        if (!pack.mobs) return;
        
        pack.mobs.forEach(mob => {
            const mobName = mob.internalName || mob.name;
            const skills = mob.skills || [];
            
            skills.forEach(skillRef => {
                // Handle different skill reference formats
                let skillName = skillRef;
                
                // If it's an object with skill name
                if (typeof skillRef === 'object') {
                    skillName = skillRef.skill || skillRef.name;
                }
                
                // Extract just the skill name (remove triggers like ~onAttack)
                skillName = skillName.split('~')[0].trim();
                
                if (this.graph.has(skillName)) {
                    const existing = this.graph.get(mobName) || [];
                    if (!existing.includes(skillName)) {
                        existing.push(skillName);
                        this.graph.set(mobName, existing);
                    }
                }
            });
        });
    }

    /**
     * Build item -> skill dependencies (via item mechanics)
     */
    _buildItemDependencies(pack) {
        if (!pack.items) return;
        
        pack.items.forEach(item => {
            const itemName = item.internalName || item.name;
            
            // Check various item fields that might reference skills
            const skillFields = ['Skills', 'UseSkill', 'EquipSkill', 'HoldSkill'];
            
            skillFields.forEach(field => {
                const skillValue = item[field];
                if (skillValue) {
                    const skills = Array.isArray(skillValue) ? skillValue : [skillValue];
                    skills.forEach(skillRef => {
                        const skillName = typeof skillRef === 'string' ? skillRef : skillRef.skill || skillRef.name;
                        if (skillName && this.graph.has(skillName)) {
                            const existing = this.graph.get(itemName) || [];
                            if (!existing.includes(skillName)) {
                                existing.push(skillName);
                                this.graph.set(itemName, existing);
                            }
                        }
                    });
                }
            });
        });
    }

    /**
     * Build droptable -> item dependencies
     */
    _buildDropTableDependencies(pack) {
        if (!pack.droptables) return;
        
        pack.droptables.forEach(table => {
            const tableName = table.internalName || table.name;
            const drops = table.drops || [];
            
            drops.forEach(drop => {
                const itemName = drop.item || drop.Item;
                if (itemName && this.graph.has(itemName)) {
                    const existing = this.graph.get(tableName) || [];
                    if (!existing.includes(itemName)) {
                        existing.push(itemName);
                        this.graph.set(tableName, existing);
                    }
                }
            });
        });
    }

    /**
     * Build randomspawn -> mob dependencies
     */
    _buildRandomSpawnDependencies(pack) {
        if (!pack.randomspawns) return;
        
        pack.randomspawns.forEach(spawn => {
            const spawnName = spawn.internalName || spawn.name;
            const mobs = spawn.mobs || [];
            
            mobs.forEach(mobRef => {
                const mobName = typeof mobRef === 'string' ? mobRef : mobRef.mob || mobRef.name;
                if (mobName && this.graph.has(mobName)) {
                    const existing = this.graph.get(spawnName) || [];
                    if (!existing.includes(mobName)) {
                        existing.push(mobName);
                        this.graph.set(spawnName, existing);
                    }
                }
            });
        });
    }

    /**
     * Extract @skill{} calls from skill content
     */
    _extractSkillCalls(content) {
        const skills = [];
        const regex = /@skill\{[^}]*s=([^}\s,]+)/gi;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            skills.push(match[1]);
        }
        
        return skills;
    }

    /**
     * Analyze graph for cycles and orphans
     */
    analyze() {
        // Detect cycles
        this.cycles = GraphUtils.detectCycles(this.graph);
        
        // Find orphans (skills never used by any mob/item)
        const allSkills = Array.from(this.nodeTypes.entries())
            .filter(([name, type]) => type === 'skill')
            .map(([name]) => name);
        
        this.orphans = GraphUtils.findOrphans(this.graph, allSkills);
        
        this.lastAnalysis = new Date();
    }

    /**
     * Get analysis results
     */
    getAnalysisResult() {
        const stats = GraphUtils.getStats(this.graph);
        
        return {
            timestamp: this.lastAnalysis,
            stats,
            cycles: this.cycles,
            orphans: this.orphans,
            hasCycles: this.cycles.length > 0,
            hasOrphans: this.orphans.length > 0
        };
    }

    /**
     * Find what depends on a specific node (impact analysis)
     */
    findImpact(nodeName) {
        const dependents = GraphUtils.findDependents(nodeName, this.graph);
        const nodeType = this.nodeTypes.get(nodeName);
        
        return {
            node: nodeName,
            type: nodeType,
            directDependents: dependents,
            impactCount: dependents.length
        };
    }

    /**
     * Show dependency graph visualization modal
     */
    showVisualization() {
        const result = this.getAnalysisResult();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content dependency-graph-modal">
                <div class="modal-header">
                    <h2>
                        <i class="fas fa-project-diagram"></i>
                        Dependency Graph Analysis
                    </h2>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <!-- Statistics Card -->
                    <div class="stats-card">
                        <h3><i class="fas fa-chart-bar"></i> Statistics</h3>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <div class="stat-value">${result.stats.nodes}</div>
                                <div class="stat-label">Total Nodes</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${result.stats.edges}</div>
                                <div class="stat-label">Dependencies</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${result.stats.avgDependencies}</div>
                                <div class="stat-label">Avg per Node</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${result.stats.maxDependencies}</div>
                                <div class="stat-label">Max Dependencies</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Cycles Section -->
                    <div class="section-card ${result.hasCycles ? 'error-card' : 'success-card'}">
                        <h3>
                            <i class="fas ${result.hasCycles ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i>
                            Circular Dependencies
                        </h3>
                        ${result.hasCycles ? `
                            <div class="warning-message">
                                <strong>⚠️ ${result.cycles.length} circular ${result.cycles.length === 1 ? 'dependency' : 'dependencies'} detected!</strong>
                                <p>These can cause infinite loops and server crashes.</p>
                            </div>
                            <div class="cycle-list">
                                ${result.cycles.map((cycle, idx) => this._renderCycle(cycle, idx)).join('')}
                            </div>
                        ` : `
                            <div class="success-message">
                                <i class="fas fa-check-circle"></i>
                                No circular dependencies found. Your pack is safe!
                            </div>
                        `}
                    </div>
                    
                    <!-- Orphans Section -->
                    <div class="section-card ${result.hasOrphans ? 'warning-card' : 'success-card'}">
                        <h3>
                            <i class="fas ${result.hasOrphans ? 'fa-unlink' : 'fa-link'}"></i>
                            Orphaned Skills
                        </h3>
                        ${result.hasOrphans ? `
                            <div class="info-message">
                                <strong>${result.orphans.length} orphaned ${result.orphans.length === 1 ? 'skill' : 'skills'} found</strong>
                                <p>These skills are not used by any mob, item, or other skill.</p>
                            </div>
                            <div class="orphan-list">
                                ${result.orphans.map(orphan => this._renderOrphan(orphan)).join('')}
                            </div>
                        ` : `
                            <div class="success-message">
                                <i class="fas fa-check-circle"></i>
                                All skills are being used. No orphans detected.
                            </div>
                        `}
                    </div>
                    
                    <!-- Node Type Breakdown -->
                    <div class="section-card">
                        <h3><i class="fas fa-layer-group"></i> Node Types</h3>
                        <div class="node-types-grid">
                            ${this._renderNodeTypeBreakdown()}
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Close
                    </button>
                    ${result.hasCycles ? `
                        <button class="btn btn-primary" onclick="window.dependencyGraph.exportCycleReport()">
                            <i class="fas fa-download"></i> Export Report
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    /**
     * Render a single cycle
     */
    _renderCycle(cycle, index) {
        const path = cycle.join(' → ');
        const types = cycle.map(node => this.nodeTypes.get(node) || 'unknown');
        
        return `
            <div class="cycle-item">
                <div class="cycle-header">
                    <span class="cycle-number">#${index + 1}</span>
                    <span class="cycle-length">${cycle.length - 1} nodes in cycle</span>
                </div>
                <div class="cycle-path">
                    ${cycle.map((node, i) => {
                        const type = this.nodeTypes.get(node);
                        const icon = this._getNodeIcon(type);
                        const isLast = i === cycle.length - 1;
                        return `
                            <span class="cycle-node ${type}">
                                <i class="${icon}"></i>
                                ${node}
                            </span>
                            ${!isLast ? '<i class="fas fa-arrow-right cycle-arrow"></i>' : ''}
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render orphaned skill
     */
    _renderOrphan(skillName) {
        const skill = this.nodeData.get(skillName);
        return `
            <div class="orphan-item">
                <i class="fas fa-file-code"></i>
                <span class="orphan-name">${skillName}</span>
                <span class="orphan-hint">Not referenced anywhere</span>
            </div>
        `;
    }

    /**
     * Render node type breakdown
     */
    _renderNodeTypeBreakdown() {
        const breakdown = {};
        
        for (const [node, type] of this.nodeTypes.entries()) {
            breakdown[type] = (breakdown[type] || 0) + 1;
        }
        
        return Object.entries(breakdown).map(([type, count]) => {
            const icon = this._getNodeIcon(type);
            return `
                <div class="node-type-item ${type}">
                    <i class="${icon}"></i>
                    <div class="node-type-info">
                        <div class="node-type-count">${count}</div>
                        <div class="node-type-label">${type}s</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Get icon for node type
     */
    _getNodeIcon(type) {
        const icons = {
            skill: 'fas fa-magic',
            mob: 'fas fa-dragon',
            item: 'fas fa-gem',
            droptable: 'fas fa-box-open',
            randomspawn: 'fas fa-random'
        };
        return icons[type] || 'fas fa-circle';
    }

    /**
     * Export cycle report
     */
    exportCycleReport() {
        const result = this.getAnalysisResult();
        const report = {
            pack: this.editor.state.currentPack?.name,
            timestamp: result.timestamp,
            cycles: this.cycles.map((cycle, idx) => ({
                number: idx + 1,
                length: cycle.length - 1,
                path: cycle,
                types: cycle.map(node => this.nodeTypes.get(node))
            })),
            orphans: this.orphans
        };
        
        const json = JSON.stringify(report, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dependency-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.editor.showToast('Report exported successfully', 'success');
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.DependencyGraph = DependencyGraph;
}
