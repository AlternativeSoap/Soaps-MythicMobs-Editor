/**
 * Pack Statistics Tool
 * Provides comprehensive analytics and metrics for MythicMobs packs
 */
class PackStatistics {
    constructor(editor) {
        this.editor = editor;
    }
    
    /**
     * Show pack statistics modal
     * @param {Object} pack - The pack to analyze
     */
    show(pack) {
        const stats = this.calculateStatistics(pack);
        this.renderModal(stats, pack);
    }
    
    /**
     * Calculate comprehensive statistics for a pack
     * @param {Object} pack - The pack to analyze
     * @returns {Object} Statistics data
     */
    calculateStatistics(pack) {
        const stats = {
            overview: this._calculateOverview(pack),
            complexity: this._calculateComplexity(pack),
            fileSize: this._calculateFileSizes(pack),
            health: this._calculateHealth(pack),
            distribution: this._calculateDistribution(pack)
        };
        
        return stats;
    }
    
    /**
     * Calculate overview statistics
     */
    _calculateOverview(pack) {
        return {
            totalMobs: Object.keys(pack.mobs || {}).length,
            totalSkills: Object.keys(pack.skills || {}).length,
            totalItems: Object.keys(pack.items || {}).length,
            totalDropTables: Object.keys(pack.droptables || {}).length,
            totalRandomSpawns: Object.keys(pack.randomspawns || {}).length,
            totalElements: this._getTotalElements(pack)
        };
    }
    
    /**
     * Calculate complexity metrics
     */
    _calculateComplexity(pack) {
        const mobs = pack.mobs || {};
        const skills = pack.skills || {};
        
        // Average skills per mob
        let totalSkillReferences = 0;
        let mobsWithSkills = 0;
        
        Object.values(mobs).forEach(mob => {
            const skillCount = this._countSkillReferences(mob);
            if (skillCount > 0) {
                totalSkillReferences += skillCount;
                mobsWithSkills++;
            }
        });
        
        const avgSkillsPerMob = mobsWithSkills > 0 
            ? (totalSkillReferences / mobsWithSkills).toFixed(2)
            : 0;
        
        // Average mechanics per skill
        let totalMechanics = 0;
        let skillsWithMechanics = 0;
        
        Object.values(skills).forEach(skill => {
            const mechanicCount = this._countMechanics(skill);
            if (mechanicCount > 0) {
                totalMechanics += mechanicCount;
                skillsWithMechanics++;
            }
        });
        
        const avgMechanicsPerSkill = skillsWithMechanics > 0
            ? (totalMechanics / skillsWithMechanics).toFixed(2)
            : 0;
        
        // Most complex mob (most skills)
        let mostComplexMob = { name: 'None', skillCount: 0 };
        Object.entries(mobs).forEach(([name, mob]) => {
            const count = this._countSkillReferences(mob);
            if (count > mostComplexMob.skillCount) {
                mostComplexMob = { name, skillCount: count };
            }
        });
        
        // Most complex skill (most mechanics)
        let mostComplexSkill = { name: 'None', mechanicCount: 0 };
        Object.entries(skills).forEach(([name, skill]) => {
            const count = this._countMechanics(skill);
            if (count > mostComplexSkill.mechanicCount) {
                mostComplexSkill = { name, mechanicCount: count };
            }
        });
        
        return {
            avgSkillsPerMob,
            avgMechanicsPerSkill,
            mostComplexMob,
            mostComplexSkill,
            totalMechanics
        };
    }
    
    /**
     * Calculate estimated file sizes
     */
    _calculateFileSizes(pack) {
        const calculateSize = (obj) => {
            return new Blob([JSON.stringify(obj, null, 2)]).size;
        };
        
        const mobsSize = calculateSize(pack.mobs || {});
        const skillsSize = calculateSize(pack.skills || {});
        const itemsSize = calculateSize(pack.items || {});
        const droptablesSize = calculateSize(pack.droptables || {});
        const randomspawnsSize = calculateSize(pack.randomspawns || {});
        
        const total = mobsSize + skillsSize + itemsSize + droptablesSize + randomspawnsSize;
        
        return {
            mobs: this._formatBytes(mobsSize),
            skills: this._formatBytes(skillsSize),
            items: this._formatBytes(itemsSize),
            droptables: this._formatBytes(droptablesSize),
            randomspawns: this._formatBytes(randomspawnsSize),
            total: this._formatBytes(total),
            totalBytes: total
        };
    }
    
    /**
     * Calculate health indicators
     */
    _calculateHealth(pack) {
        let warnings = 0;
        let tips = [];
        
        // Check for empty categories
        const overview = this._calculateOverview(pack);
        if (overview.totalMobs === 0) {
            warnings++;
            tips.push('No mobs defined in pack');
        }
        if (overview.totalSkills === 0) {
            warnings++;
            tips.push('No skills defined in pack');
        }
        
        // Check for unused skills (orphans)
        const orphanedSkills = this._findOrphanedSkills(pack);
        if (orphanedSkills.length > 0) {
            warnings++;
            tips.push(`${orphanedSkills.length} unused skill(s) detected`);
        }
        
        // Check pack size
        const fileSize = this._calculateFileSizes(pack);
        if (fileSize.totalBytes > 1024 * 1024) { // > 1MB
            tips.push('Large pack size may affect performance');
        }
        
        // Determine health status
        let status = 'excellent';
        if (warnings === 0) {
            status = 'excellent';
        } else if (warnings <= 2) {
            status = 'good';
        } else if (warnings <= 5) {
            status = 'fair';
        } else {
            status = 'needs-attention';
        }
        
        return {
            status,
            warnings,
            tips
        };
    }
    
    /**
     * Calculate distribution of element types
     */
    _calculateDistribution(pack) {
        const total = this._getTotalElements(pack);
        const overview = this._calculateOverview(pack);
        
        return {
            mobs: total > 0 ? ((overview.totalMobs / total) * 100).toFixed(1) : 0,
            skills: total > 0 ? ((overview.totalSkills / total) * 100).toFixed(1) : 0,
            items: total > 0 ? ((overview.totalItems / total) * 100).toFixed(1) : 0,
            droptables: total > 0 ? ((overview.totalDropTables / total) * 100).toFixed(1) : 0,
            randomspawns: total > 0 ? ((overview.totalRandomSpawns / total) * 100).toFixed(1) : 0
        };
    }
    
    /**
     * Count skill references in a mob
     */
    _countSkillReferences(mob) {
        if (!mob || !mob.Skills) return 0;
        return mob.Skills.length || 0;
    }
    
    /**
     * Count mechanics in a skill
     */
    _countMechanics(skill) {
        if (!skill || !skill.Skills) return 0;
        
        if (Array.isArray(skill.Skills)) {
            return skill.Skills.length;
        }
        
        if (typeof skill.Skills === 'string') {
            // Count line breaks as mechanics
            return skill.Skills.split('\n').filter(line => line.trim().length > 0).length;
        }
        
        return 0;
    }
    
    /**
     * Find orphaned skills (not referenced anywhere)
     */
    _findOrphanedSkills(pack) {
        const allSkills = new Set(Object.keys(pack.skills || {}));
        const referencedSkills = new Set();
        
        // Check mob skills
        Object.values(pack.mobs || {}).forEach(mob => {
            if (mob.Skills) {
                mob.Skills.forEach(skillRef => {
                    const match = skillRef.match(/@skill{s=([\w-]+)}/);
                    if (match) referencedSkills.add(match[1]);
                });
            }
        });
        
        // Check skill-to-skill references
        Object.values(pack.skills || {}).forEach(skill => {
            if (skill.Skills) {
                const skillContent = Array.isArray(skill.Skills) 
                    ? skill.Skills.join('\n')
                    : skill.Skills;
                
                const matches = skillContent.matchAll(/@skill{s=([\w-]+)}/g);
                for (const match of matches) {
                    referencedSkills.add(match[1]);
                }
            }
        });
        
        // Find orphans
        const orphaned = [];
        allSkills.forEach(skill => {
            if (!referencedSkills.has(skill)) {
                orphaned.push(skill);
            }
        });
        
        return orphaned;
    }
    
    /**
     * Get total number of elements in pack
     */
    _getTotalElements(pack) {
        return (
            Object.keys(pack.mobs || {}).length +
            Object.keys(pack.skills || {}).length +
            Object.keys(pack.items || {}).length +
            Object.keys(pack.droptables || {}).length +
            Object.keys(pack.randomspawns || {}).length
        );
    }
    
    /**
     * Format bytes to human-readable size
     */
    _formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Render statistics modal
     */
    renderModal(stats, pack) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'pack-statistics-modal';
        
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>
                        <i class="fas fa-chart-bar"></i>
                        Pack Statistics
                    </h2>
                    <button class="btn-close" onclick="document.getElementById('pack-statistics-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <!-- Health Status -->
                    <div class="stats-health-banner ${stats.health.status}">
                        <i class="fas ${this._getHealthIcon(stats.health.status)}"></i>
                        <div>
                            <strong>Pack Health: ${this._getHealthLabel(stats.health.status)}</strong>
                            ${stats.health.warnings > 0 ? `<span>(${stats.health.warnings} warning(s))</span>` : ''}
                        </div>
                    </div>
                    
                    ${stats.health.tips.length > 0 ? `
                        <div class="stats-tips">
                            <h4><i class="fas fa-lightbulb"></i> Recommendations</h4>
                            <ul>
                                ${stats.health.tips.map(tip => `<li>${tip}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <!-- Overview Grid -->
                    <div class="stats-section">
                        <h3>Overview</h3>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <i class="fas fa-dragon"></i>
                                <div class="stat-value">${stats.overview.totalMobs}</div>
                                <div class="stat-label">Mobs</div>
                            </div>
                            <div class="stat-card">
                                <i class="fas fa-wand-magic-sparkles"></i>
                                <div class="stat-value">${stats.overview.totalSkills}</div>
                                <div class="stat-label">Skills</div>
                            </div>
                            <div class="stat-card">
                                <i class="fas fa-gem"></i>
                                <div class="stat-value">${stats.overview.totalItems}</div>
                                <div class="stat-label">Items</div>
                            </div>
                            <div class="stat-card">
                                <i class="fas fa-table"></i>
                                <div class="stat-value">${stats.overview.totalDropTables}</div>
                                <div class="stat-label">Drop Tables</div>
                            </div>
                            <div class="stat-card">
                                <i class="fas fa-location-dot"></i>
                                <div class="stat-value">${stats.overview.totalRandomSpawns}</div>
                                <div class="stat-label">Random Spawns</div>
                            </div>
                            <div class="stat-card accent">
                                <i class="fas fa-cubes"></i>
                                <div class="stat-value">${stats.overview.totalElements}</div>
                                <div class="stat-label">Total Elements</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Complexity Metrics -->
                    <div class="stats-section">
                        <h3>Complexity Metrics</h3>
                        <div class="stats-grid cols-3">
                            <div class="stat-card">
                                <div class="stat-value">${stats.complexity.avgSkillsPerMob}</div>
                                <div class="stat-label">Avg Skills per Mob</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${stats.complexity.avgMechanicsPerSkill}</div>
                                <div class="stat-label">Avg Mechanics per Skill</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${stats.complexity.totalMechanics}</div>
                                <div class="stat-label">Total Mechanics</div>
                            </div>
                        </div>
                        
                        <div class="stats-highlights">
                            <div class="highlight-item">
                                <strong>Most Complex Mob:</strong>
                                <span>${stats.complexity.mostComplexMob.name} (${stats.complexity.mostComplexMob.skillCount} skills)</span>
                            </div>
                            <div class="highlight-item">
                                <strong>Most Complex Skill:</strong>
                                <span>${stats.complexity.mostComplexSkill.name} (${stats.complexity.mostComplexSkill.mechanicCount} mechanics)</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- File Size Breakdown -->
                    <div class="stats-section">
                        <h3>File Size Breakdown</h3>
                        <div class="stats-file-breakdown">
                            <div class="file-size-item">
                                <span class="label"><i class="fas fa-dragon"></i> Mobs</span>
                                <span class="size">${stats.fileSize.mobs}</span>
                            </div>
                            <div class="file-size-item">
                                <span class="label"><i class="fas fa-wand-magic-sparkles"></i> Skills</span>
                                <span class="size">${stats.fileSize.skills}</span>
                            </div>
                            <div class="file-size-item">
                                <span class="label"><i class="fas fa-gem"></i> Items</span>
                                <span class="size">${stats.fileSize.items}</span>
                            </div>
                            <div class="file-size-item">
                                <span class="label"><i class="fas fa-table"></i> Drop Tables</span>
                                <span class="size">${stats.fileSize.droptables}</span>
                            </div>
                            <div class="file-size-item">
                                <span class="label"><i class="fas fa-location-dot"></i> Random Spawns</span>
                                <span class="size">${stats.fileSize.randomspawns}</span>
                            </div>
                            <div class="file-size-item total">
                                <span class="label"><strong>Total Pack Size</strong></span>
                                <span class="size"><strong>${stats.fileSize.total}</strong></span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Distribution Chart -->
                    <div class="stats-section">
                        <h3>Content Distribution</h3>
                        <div class="distribution-chart">
                            <div class="distribution-bar">
                                ${stats.distribution.mobs > 0 ? `<div class="bar-segment mobs" style="width: ${stats.distribution.mobs}%" title="Mobs: ${stats.distribution.mobs}%"></div>` : ''}
                                ${stats.distribution.skills > 0 ? `<div class="bar-segment skills" style="width: ${stats.distribution.skills}%" title="Skills: ${stats.distribution.skills}%"></div>` : ''}
                                ${stats.distribution.items > 0 ? `<div class="bar-segment items" style="width: ${stats.distribution.items}%" title="Items: ${stats.distribution.items}%"></div>` : ''}
                                ${stats.distribution.droptables > 0 ? `<div class="bar-segment droptables" style="width: ${stats.distribution.droptables}%" title="Drop Tables: ${stats.distribution.droptables}%"></div>` : ''}
                                ${stats.distribution.randomspawns > 0 ? `<div class="bar-segment randomspawns" style="width: ${stats.distribution.randomspawns}%" title="Random Spawns: ${stats.distribution.randomspawns}%"></div>` : ''}
                            </div>
                            <div class="distribution-legend">
                                <div class="legend-item"><span class="color-box mobs"></span> Mobs (${stats.distribution.mobs}%)</div>
                                <div class="legend-item"><span class="color-box skills"></span> Skills (${stats.distribution.skills}%)</div>
                                <div class="legend-item"><span class="color-box items"></span> Items (${stats.distribution.items}%)</div>
                                <div class="legend-item"><span class="color-box droptables"></span> Drop Tables (${stats.distribution.droptables}%)</div>
                                <div class="legend-item"><span class="color-box randomspawns"></span> Random Spawns (${stats.distribution.randomspawns}%)</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('pack-statistics-modal').remove()">
                        Close
                    </button>
                    <button class="btn btn-primary" onclick="window.packStatisticsInstance.exportReport()">
                        <i class="fas fa-download"></i> Export Report
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Store instance for export
        window.packStatisticsInstance = this;
        this._currentStats = stats;
        this._currentPack = pack;
    }
    
    /**
     * Get health status icon
     */
    _getHealthIcon(status) {
        const icons = {
            'excellent': 'fa-check-circle',
            'good': 'fa-thumbs-up',
            'fair': 'fa-exclamation-triangle',
            'needs-attention': 'fa-times-circle'
        };
        return icons[status] || 'fa-info-circle';
    }
    
    /**
     * Get health status label
     */
    _getHealthLabel(status) {
        const labels = {
            'excellent': 'Excellent',
            'good': 'Good',
            'fair': 'Fair',
            'needs-attention': 'Needs Attention'
        };
        return labels[status] || 'Unknown';
    }
    
    /**
     * Export statistics report
     */
    exportReport() {
        const report = {
            packName: this._currentPack.name || 'Unknown Pack',
            timestamp: new Date().toISOString(),
            statistics: this._currentStats
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.packName}_statistics_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.editor.showToast('Statistics report exported', 'success');
    }
}
