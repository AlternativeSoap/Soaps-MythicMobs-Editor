/**
 * Skill Usage Report Tool
 * Generates usage analytics for skills in the pack
 */
class SkillUsageReport {
    constructor(editor) {
        this.editor = editor;
    }
    
    /**
     * Generate skill usage report
     * @param {Object} pack - The pack to analyze
     */
    generate(pack) {
        const usage = this._analyzeSkillUsage(pack);
        this.renderModal(usage, pack);
    }
    
    /**
     * Analyze skill usage across the pack
     */
    _analyzeSkillUsage(pack) {
        const skills = Object.keys(pack.skills || {});
        const usageMap = new Map();
        
        // Initialize usage map
        skills.forEach(skill => {
            usageMap.set(skill, {
                name: skill,
                usedByMobs: [],
                usedBySkills: [],
                totalUsage: 0
            });
        });
        
        // Count mob references
        Object.entries(pack.mobs || {}).forEach(([mobName, mob]) => {
            if (mob.Skills) {
                mob.Skills.forEach(skillRef => {
                    const match = skillRef.match(/@skill{s=([\w-]+)}/);
                    if (match && usageMap.has(match[1])) {
                        const usage = usageMap.get(match[1]);
                        usage.usedByMobs.push(mobName);
                        usage.totalUsage++;
                    }
                });
            }
        });
        
        // Count skill-to-skill references
        Object.entries(pack.skills || {}).forEach(([skillName, skill]) => {
            if (skill.Skills) {
                const skillContent = Array.isArray(skill.Skills)
                    ? skill.Skills.join('\n')
                    : skill.Skills;
                
                const matches = skillContent.matchAll(/@skill{s=([\w-]+)}/g);
                for (const match of matches) {
                    if (usageMap.has(match[1])) {
                        const usage = usageMap.get(match[1]);
                        usage.usedBySkills.push(skillName);
                        usage.totalUsage++;
                    }
                }
            }
        });
        
        // Convert to array and sort
        const usageArray = Array.from(usageMap.values());
        usageArray.sort((a, b) => b.totalUsage - a.totalUsage);
        
        // Calculate stats
        const stats = {
            totalSkills: skills.length,
            usedSkills: usageArray.filter(s => s.totalUsage > 0).length,
            unusedSkills: usageArray.filter(s => s.totalUsage === 0).length,
            averageUsage: usageArray.length > 0
                ? (usageArray.reduce((sum, s) => sum + s.totalUsage, 0) / usageArray.length).toFixed(2)
                : 0,
            topUsed: usageArray.slice(0, 10),
            leastUsed: usageArray.filter(s => s.totalUsage > 0).slice(-10).reverse(),
            unused: usageArray.filter(s => s.totalUsage === 0)
        };
        
        return stats;
    }
    
    /**
     * Render usage report modal
     */
    renderModal(usage, pack) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'skill-usage-modal';
        
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>
                        <i class="fas fa-chart-line"></i>
                        Skill Usage Report
                    </h2>
                    <button class="btn-close" onclick="document.getElementById('skill-usage-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <!-- Summary Stats -->
                    <div class="usage-summary">
                        <div class="usage-stat">
                            <div class="stat-icon"><i class="fas fa-wand-magic-sparkles"></i></div>
                            <div>
                                <strong>${usage.totalSkills}</strong>
                                <span>Total Skills</span>
                            </div>
                        </div>
                        <div class="usage-stat success">
                            <div class="stat-icon"><i class="fas fa-check"></i></div>
                            <div>
                                <strong>${usage.usedSkills}</strong>
                                <span>In Use</span>
                            </div>
                        </div>
                        <div class="usage-stat ${usage.unusedSkills > 0 ? 'warning' : ''}">
                            <div class="stat-icon"><i class="fas fa-ghost"></i></div>
                            <div>
                                <strong>${usage.unusedSkills}</strong>
                                <span>Unused</span>
                            </div>
                        </div>
                        <div class="usage-stat">
                            <div class="stat-icon"><i class="fas fa-chart-bar"></i></div>
                            <div>
                                <strong>${usage.averageUsage}</strong>
                                <span>Avg Usage</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Distribution Chart -->
                    ${usage.usedSkills > 0 ? `
                        <div class="usage-section">
                            <h3>Usage Distribution</h3>
                            <div class="usage-distribution-chart">
                                ${this._renderDistributionChart(usage.topUsed.slice(0, 5))}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Top Used Skills -->
                    ${usage.topUsed.length > 0 ? `
                        <div class="usage-section">
                            <h3><i class="fas fa-fire"></i> Most Used Skills</h3>
                            <div class="usage-list">
                                ${usage.topUsed.map((skill, index) => this._renderSkillUsage(skill, index + 1)).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Least Used Skills -->
                    ${usage.leastUsed.length > 0 ? `
                        <div class="usage-section">
                            <h3><i class="fas fa-arrow-down"></i> Least Used Skills</h3>
                            <div class="usage-list">
                                ${usage.leastUsed.map((skill, index) => this._renderSkillUsage(skill, null)).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Unused Skills -->
                    ${usage.unused.length > 0 ? `
                        <div class="usage-section">
                            <h3><i class="fas fa-ghost"></i> Unused Skills</h3>
                            <div class="unused-skills-list">
                                ${usage.unused.map(skill => `
                                    <div class="unused-skill-badge">${skill.name}</div>
                                `).join('')}
                            </div>
                            <div class="usage-recommendation">
                                <i class="fas fa-lightbulb"></i>
                                <strong>Recommendation:</strong> Consider removing unused skills to reduce pack size and improve maintainability.
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('skill-usage-modal').remove()">
                        Close
                    </button>
                    <button class="btn btn-primary" onclick="window.skillUsageReportInstance.exportReport()">
                        <i class="fas fa-download"></i> Export Report
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Store instance for export
        window.skillUsageReportInstance = this;
        this._currentUsage = usage;
        this._currentPack = pack;
    }
    
    /**
     * Render distribution chart
     */
    _renderDistributionChart(topSkills) {
        const maxUsage = Math.max(...topSkills.map(s => s.totalUsage), 1);
        
        return topSkills.map(skill => {
            const percentage = (skill.totalUsage / maxUsage) * 100;
            return `
                <div class="distribution-bar-item">
                    <div class="bar-label">${skill.name}</div>
                    <div class="bar-container">
                        <div class="bar-fill" style="width: ${percentage}%"></div>
                        <span class="bar-value">${skill.totalUsage}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Render skill usage item
     */
    _renderSkillUsage(skill, rank) {
        return `
            <div class="usage-item">
                ${rank ? `<div class="usage-rank">#${rank}</div>` : ''}
                <div class="usage-info">
                    <strong>${skill.name}</strong>
                    <div class="usage-details">
                        ${skill.usedByMobs.length > 0 ? `<span><i class="fas fa-dragon"></i> ${skill.usedByMobs.length} mob(s)</span>` : ''}
                        ${skill.usedBySkills.length > 0 ? `<span><i class="fas fa-wand-magic-sparkles"></i> ${skill.usedBySkills.length} skill(s)</span>` : ''}
                    </div>
                </div>
                <div class="usage-count">${skill.totalUsage}</div>
            </div>
        `;
    }
    
    /**
     * Export usage report
     */
    exportReport() {
        const report = {
            packName: this._currentPack.name || 'Unknown Pack',
            timestamp: new Date().toISOString(),
            usage: this._currentUsage
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `skill_usage_report_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.editor.showToast('Usage report exported', 'success');
    }
}
