/**
 * SkillBuilderEditor Component
 * Visual editor for creating MythicMobs skill lines
 * Simplified approach: each entry is a single skill line string
 * Context-aware for mob vs skill files
 */

class SkillBuilderEditor {
    constructor(container, targeterBrowser = null, mechanicBrowser = null) {
        // Handle both element and string ID
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        // NEW MODEL: Object of named skills instead of flat array
        this.skills = {}; // { skillName: { lines: ['- mechanic{}', ...] } }
        this.currentSkill = 'DefaultSkill'; // Active skill being edited
        this.skillLines = []; // DEPRECATED: Kept for backward compatibility
        this.context = 'mob'; // 'mob' or 'skill'
        this.changeCallback = null;
        
        // Browser components
        this.targeterBrowser = targeterBrowser;
        this.mechanicBrowser = mechanicBrowser;
        
        // Creation Mode Selector & Template Selector & Skill Line Builder
        this.creationModeSelector = new CreationModeSelector();
        this.templateSelector = new TemplateSelector();
        this.skillLineBuilder = new SkillLineBuilder();
        
        // Group detection
        this.groupDetector = new SkillLineGroupDetector();
        this.groups = [];
        this.showGroups = true; // Toggle for showing grouped view
        this.collapsedGroups = new Set(); // Track collapsed groups
        
        // Quick edit popover
        this.quickEdit = new SkillLineQuickEdit();
        
        // Context tooltips
        this.tooltip = new SkillLineTooltip();
        
        // Pattern analyzer
        this.patternAnalyzer = new SkillPatternAnalyzer();
        this.analysisResults = null;
        this.showAnalysis = false; // Toggle for showing analysis panel
        
        // Validation panel (persistent sidebar)
        this.validationPanel = null;
        this.showValidationPanel = false;
        
        // Dependency tracker
        this.dependencyTracker = new SkillDependencyTracker();
        this.dependencyResults = null;
        this.showDependencies = false;
        
        // Line formatter
        this.formatter = new SkillLineFormatter();
        
        // Duplicate detector
        this.duplicateDetector = new SkillLineDuplicateDetector();
        this.duplicateResults = null;
        this.showDuplicates = false;
        
        // Syntax highlighter
        this.syntaxHighlighter = new SkillLineSyntaxHighlighter();
        
        // History manager for undo/redo
        this.historyManager = new HistoryManager();
        this.setupHistoryManager();
        
        // Performance optimizations
        this.setupPerformanceOptimizations();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        this.render();
        this.attachEventListeners();
        
        // Save initial state
        this.saveHistoryState('Initial state');
    }
    
    /**
     * Setup history manager for undo/redo
     */
    setupHistoryManager() {
        if (!this.historyManager) return;
        
        // Listen for undo events
        document.addEventListener('history-undo', (e) => {
            if (e.detail && e.detail.state) {
                this.restoreState(e.detail.state);
            }
        });
        
        // Listen for redo events
        document.addEventListener('history-redo', (e) => {
            if (e.detail && e.detail.state) {
                this.restoreState(e.detail.state);
            }
        });
    }
    
    /**
     * Save current state to history
     */
    saveHistoryState(description) {
        if (!this.historyManager) return;
        
        const state = {
            skillLines: typeof structuredClone !== 'undefined' ? structuredClone(this.skillLines) : JSON.parse(JSON.stringify(this.skillLines)),
            skills: typeof structuredClone !== 'undefined' ? structuredClone(this.skills) : JSON.parse(JSON.stringify(this.skills)),
            currentSkill: this.currentSkill,
            context: this.context
        };
        
        this.historyManager.saveState(state, description);
    }
    
    /**
     * Restore state from history
     */
    restoreState(state) {
        if (!state) return;
        
        this.skillLines = state.skillLines || [];
        this.skills = state.skills || {};
        this.currentSkill = state.currentSkill || Object.keys(this.skills)[0];
        this.context = state.context || this.context;
        
        this.render();
        this.attachEventListeners();
        this.triggerChange();
    }
    
    /**
     * Setup performance optimizations
     */
    setupPerformanceOptimizations() {
        // Create validation cache with 30 second TTL
        this.validationCache = PerformanceUtils.createCache(30000);
        
        // Create analysis cache with 60 second TTL
        this.analysisCache = PerformanceUtils.createCache(60000);
        
        // Debounced render (prevents excessive re-renders)
        this.debouncedRender = PerformanceUtils.debounce(() => {
            this.render();
        }, 150);
        
        // Debounced validation
        this.debouncedValidate = PerformanceUtils.debounce(() => {
            this.performValidation();
        }, 300);
        
        // Debounced analysis
        this.debouncedAnalyze = PerformanceUtils.debounce(() => {
            this.performAnalysis();
        }, 500);
    }
    
    /**
     * Perform validation with caching
     */
    performValidation() {
        const cacheKey = JSON.stringify(this.skillLines);
        
        // Check cache first
        if (this.validationCache && this.validationCache.has(cacheKey)) {
            return this.validationCache.get(cacheKey);
        }
        
        // Perform validation
        const results = this.validateSkillLines();
        
        // Cache results
        if (this.validationCache) {
            this.validationCache.set(cacheKey, results);
        }
        
        return results;
    }
    
    /**
     * Perform analysis with caching
     */
    performAnalysis() {
        if (!this.patternAnalyzer) return null;
        
        const cacheKey = JSON.stringify(this.skillLines);
        
        // Check cache first
        if (this.analysisCache && this.analysisCache.has(cacheKey)) {
            return this.analysisCache.get(cacheKey);
        }
        
        // Perform analysis
        const results = this.patternAnalyzer.analyzeSkill(this.skillLines);
        
        // Cache results
        if (this.analysisCache) {
            this.analysisCache.set(cacheKey, results);
        }
        
        return results;
    }
    
    /**
     * Clear performance caches when data changes
     */
    clearPerformanceCaches() {
        if (this.validationCache) {
            this.validationCache.clear();
        }
        if (this.analysisCache) {
            this.analysisCache.clear();
        }
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        // Listen for keyboard shortcut events
        document.addEventListener('keyboard-shortcut', (e) => {
            this.handleKeyboardShortcut(e.detail.action);
        });
    }
    
    /**
     * Handle keyboard shortcut action
     * @param {string} action - Action name
     */
    handleKeyboardShortcut(action) {
        switch (action) {
            case 'save':
                this.triggerChange();
                this.showNotification('Changes saved!', 'success');
                break;
                
            case 'format-all':
                this.formatAllLines();
                break;
                
            case 'toggle-duplicates':
                this.showDuplicates = !this.showDuplicates;
                this.render();
                break;
                
            case 'toggle-groups':
                this.showGroups = !this.showGroups;
                this.render();
                break;
                
            case 'toggle-analysis':
            case 'toggle-insights':
                this.showAnalysis = !this.showAnalysis;
                this.render();
                break;
                
            case 'toggle-dependencies':
                if (this.context === 'skill') {
                    this.showDependencies = !this.showDependencies;
                    this.render();
                }
                break;
                
            case 'add-line':
                this.addSkillLine();
                break;
                
            case 'help':
                if (window.keyboardShortcutManager) {
                    window.keyboardShortcutManager.showHelp();
                }
                break;
                
            case 'escape':
                // Close all panels
                this.showAnalysis = false;
                this.showDependencies = false;
                this.showDuplicates = false;
                this.render();
                break;
        }
    }
    
    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, info)
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        this.container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
    
    /**
     * Get all lines from current skill (for current context)
     */
    getSkillLines() {
        if (this.context === 'mob') {
            // Mob context: return flat array of all lines
            return this.skillLines;
        } else {
            // Skill context: return lines from current skill
            return this.skills[this.currentSkill]?.lines || [];
        }
    }

    /**
     * Get all skills (for skill context)
     */
    getAllSkills() {
        return this.skills;
    }

    /**
     * Set context (mob or skill)
     */
    setContext(context) {
        this.context = context;
        // Initialize default skill if switching to skill context
        if (context === 'skill' && Object.keys(this.skills).length === 0) {
            this.skills[this.currentSkill] = { lines: [] };
        }
        this.render();
    }
    
    /**
     * Collect all skill references from mobs in the active pack
     * @returns {Set} Set of skill names referenced by mobs
     */
    getMobSkillReferences() {
        const references = new Set();
        
        try {
            const pack = this.editor?.packManager?.activePack;
            if (!pack?.mobs) return references;
            
            // Iterate through all mob files and entries
            pack.mobs.forEach(file => {
                const entries = file.entries || [file];
                entries.forEach(mob => {
                    // Check Skills array
                    if (mob.Skills && Array.isArray(mob.Skills)) {
                        mob.Skills.forEach(skillLine => {
                            // Extract skill name from skill line (e.g., "skill{s=PINATA_CANCEL_DMG;sync=true}")
                            const skillMatch = skillLine.match(/skill\s*\{\s*s(?:kill)?\s*=\s*([^;}\s]+)/i);
                            if (skillMatch) {
                                references.add(skillMatch[1]);
                            }
                            // Also check for meta/metaskill references
                            const metaMatch = skillLine.match(/meta(?:skill)?\s*\{\s*(?:s(?:kill)?|m)\s*=\s*([^;}\s]+)/i);
                            if (metaMatch) {
                                references.add(metaMatch[1]);
                            }
                        });
                    }
                });
            });
        } catch (e) {
            console.warn('Could not collect mob skill references:', e);
        }
        
        return references;
    }

    render() {
        if (!this.container) return;
        
        // Detect groups and analyze patterns before rendering (context-aware)
        const linesToAnalyze = this.context === 'mob' ? this.skillLines : this.getSkillLines();
        this.groups = this.groupDetector.detectGroups(linesToAnalyze);
        this.analysisResults = this.patternAnalyzer.analyze(linesToAnalyze);
        
        // Analyze dependencies (for skill context only)
        if (this.context === 'skill') {
            // Get external references from mobs
            const mobRefs = this.getMobSkillReferences();
            this.dependencyResults = this.dependencyTracker.analyze(this.skills, 'skill', mobRefs);
        } else {
            this.dependencyResults = this.dependencyTracker.analyze(linesToAnalyze, 'mob');
        }
        
        // Analyze duplicates
        this.duplicateResults = this.duplicateDetector.analyze(linesToAnalyze);
        
        const summary = this.patternAnalyzer.getSummary(this.analysisResults);
        const depSummary = this.dependencyResults.summary;
        const dupSummary = this.duplicateResults.summary;
        
        // Collect all problems from analysis and dependencies
        const allProblems = [
            ...this.analysisResults.antiPatterns,
            ...this.dependencyResults.issues
        ];
        
        // Total insights count (issues + tips)
        const insightsCount = allProblems.length + (this.analysisResults.tips?.length || 0);
        
        this.container.innerHTML = `
            <div class="skill-builder-editor">
                <div class="skill-builder-main">
                    <!-- Analysis & Action Toolbar -->
                    <div class="skill-builder-toolbar">
                        <!-- View Toggles -->
                        <div class="toolbar-section">
                            <button class="btn btn-sm toggle-groups-btn ${this.groups.length === 0 ? 'disabled' : ''}" id="toggle-groups-btn" title="${this.groups.length === 0 ? 'No groups detected - add comments like # Group Name to create groups' : (this.showGroups ? 'Switch to flat list view' : 'Switch to grouped view')}">
                                <i class="fas fa-${this.showGroups ? 'layer-group' : 'list'}"></i>
                                ${this.showGroups ? 'Grouped' : 'List'}
                            </button>
                            ${this.groups.length > 0 ? `
                                <span class="group-stats">
                                    ${this.groups.length} group${this.groups.length !== 1 ? 's' : ''}
                                </span>
                            ` : ''}
                        </div>
                        
                        <!-- Analysis Tools -->
                        <div class="toolbar-section toolbar-divider">
                            <button class="btn btn-sm toggle-insights-btn ${this.showAnalysis ? 'active' : ''}" id="toggle-insights-btn" title="${this.showAnalysis ? 'Hide' : 'Show'} insights & tips">
                                <i class="fas fa-lightbulb"></i>
                                Insights
                                ${allProblems.length > 0 ? `<span class="badge badge-error">${allProblems.length}</span>` : ''}
                                ${this.analysisResults.tips?.length > 0 ? `<span class="badge badge-tip">${this.analysisResults.tips.length}</span>` : ''}
                            </button>
                            ${this.context === 'skill' ? `
                                <button class="btn btn-sm toggle-dependencies-btn ${this.showDependencies ? 'active' : ''}" id="toggle-dependencies-btn" title="${this.showDependencies ? 'Hide' : 'Show'} dependencies">
                                    <i class="fas fa-project-diagram"></i>
                                    Dependencies
                                    ${depSummary.missingSkills + depSummary.circularDeps > 0 ? `<span class="badge badge-error">${depSummary.missingSkills + depSummary.circularDeps}</span>` : ''}
                                </button>
                            ` : ''}
                            <button class="btn btn-sm toggle-duplicates-btn ${this.showDuplicates ? 'active' : ''}" id="toggle-duplicates-btn" title="${this.showDuplicates ? 'Hide' : 'Show'} duplicates">
                                <i class="fas fa-clone"></i>
                                Duplicates
                                ${dupSummary.exactDuplicates + dupSummary.similarGroups > 0 ? `<span class="badge badge-warning">${dupSummary.exactDuplicates + dupSummary.similarGroups}</span>` : ''}
                            </button>
                        </div>
                        
                        <!-- Actions -->
                        <div class="toolbar-section toolbar-divider ml-auto">
                            <button class="btn btn-sm btn-icon undo-btn" disabled title="Undo (Ctrl+Z)">
                                <i class="fas fa-undo"></i>
                            </button>
                            <button class="btn btn-sm btn-icon redo-btn" disabled title="Redo (Ctrl+Y)">
                                <i class="fas fa-redo"></i>
                            </button>
                            <button class="btn btn-sm format-all-btn" id="format-all-btn" title="Format all skill lines">
                                <i class="fas fa-magic"></i>
                                Format
                            </button>
                        </div>
                    </div>
                    
                    ${this.showAnalysis ? this.renderInsightsPanel() : ''}
                    ${this.showDependencies ? this.renderDependencyPanel() : ''}
                    ${this.showDuplicates ? this.renderDuplicatePanel() : ''}
                    
                    <div class="skill-lines-list">
                        ${this.renderSkillLinesList()}
                    </div>
                    <button class="btn btn-primary add-skill-line-btn" id="add-skill-line-btn">
                        <i class="fas fa-plus"></i> Add Skill Line
                    </button>
                </div>
            </div>
        `;
        
        this.attachEventListeners();
        
        // Enable tooltips on skill line previews
        this.tooltip.enableTooltips(this.container);
    }

    /**
     * Render unified Insights panel (merged Analysis + Problems + Tips)
     */
    renderInsightsPanel() {
        if (!this.analysisResults) return '';
        
        const { patterns, antiPatterns, tips } = this.analysisResults;
        const depIssues = this.dependencyResults?.issues || [];
        const allIssues = [...antiPatterns, ...depIssues];
        const summary = this.patternAnalyzer.getSummary(this.analysisResults);
        
        return `
            <div class="insights-panel">
                <div class="insights-header">
                    <h3><i class="fas fa-lightbulb"></i> Skill Insights</h3>
                    <div class="insights-summary">
                        ${summary.severity.error > 0 ? `
                            <span class="summary-item error">
                                <i class="fas fa-times-circle"></i> ${summary.severity.error} errors
                            </span>
                        ` : ''}
                        ${summary.severity.warning > 0 ? `
                            <span class="summary-item warning">
                                <i class="fas fa-exclamation-triangle"></i> ${summary.severity.warning} warnings
                            </span>
                        ` : ''}
                        ${tips && tips.length > 0 ? `
                            <span class="summary-item tip">
                                <i class="fas fa-lightbulb"></i> ${tips.length} tips
                            </span>
                        ` : ''}
                        ${patterns.length > 0 ? `
                            <span class="summary-item info">
                                <i class="fas fa-check-circle"></i> ${patterns.length} patterns
                            </span>
                        ` : ''}
                    </div>
                </div>
                
                <div class="insights-content">
                    ${allIssues.length > 0 ? `
                        <div class="insights-section issues-section">
                            <h4><i class="fas fa-exclamation-circle"></i> Issues to Fix</h4>
                            ${allIssues.map((issue, idx) => `
                                <div class="insights-item ${issue.severity}" data-issue-index="${idx}">
                                    <div class="insights-item-header">
                                        <span class="insights-icon">${issue.icon || '⚠️'}</span>
                                        <span class="insights-name">${issue.name || issue.type}</span>
                                        <span class="insights-severity ${issue.severity}">${issue.severity}</span>
                                    </div>
                                    <div class="insights-message">${issue.message}</div>
                                    ${issue.suggestion ? `
                                        <div class="insights-suggestion">
                                            <i class="fas fa-arrow-right"></i> ${issue.suggestion}
                                        </div>
                                    ` : ''}
                                    ${issue.lineIndices ? `
                                        <div class="insights-lines">
                                            Line${issue.lineIndices.length > 1 ? 's' : ''}: ${issue.lineIndices.map(i => i + 1).join(', ')}
                                            <button class="btn-link jump-to-line-btn" data-line-index="${issue.lineIndices[0]}">
                                                Jump
                                            </button>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${tips && tips.length > 0 ? `
                        <div class="insights-section tips-section">
                            <h4><i class="fas fa-lightbulb"></i> Tips & Suggestions</h4>
                            ${tips.map((tip, idx) => `
                                <div class="insights-item tip" data-tip-index="${idx}">
                                    <div class="insights-item-header">
                                        <span class="insights-icon">${tip.icon}</span>
                                        <span class="insights-name">${tip.name}</span>
                                    </div>
                                    <div class="insights-message">${tip.message}</div>
                                    <div class="insights-suggestion">
                                        <i class="fas fa-arrow-right"></i> ${tip.suggestion}
                                    </div>
                                    ${tip.lineIndices ? `
                                        <div class="insights-lines">
                                            Line${tip.lineIndices.length > 1 ? 's' : ''}: ${tip.lineIndices.map(i => i + 1).join(', ')}
                                            <button class="btn-link jump-to-line-btn" data-line-index="${tip.lineIndices[0]}">
                                                Jump
                                            </button>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${patterns.length > 0 ? `
                        <div class="insights-section patterns-section">
                            <h4><i class="fas fa-check-circle"></i> Good Patterns</h4>
                            ${patterns.map((pattern, idx) => `
                                <div class="insights-item success" data-pattern-index="${idx}">
                                    <div class="insights-item-header">
                                        <span class="insights-icon">${pattern.icon}</span>
                                        <span class="insights-name">${pattern.name}</span>
                                    </div>
                                    <div class="insights-message">${pattern.message}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${allIssues.length === 0 && (!tips || tips.length === 0) && patterns.length === 0 ? `
                        <div class="insights-empty">
                            <i class="fas fa-check-circle"></i>
                            <p>No issues found. Your skill looks good!</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderDependencyPanel() {
        if (!this.dependencyResults) return '';
        
        const { dependencies, usages, issues, summary } = this.dependencyResults;
        const graphData = this.dependencyTracker.generateGraphData();
        
        return `
            <div class="dependency-panel">
                <div class="dependency-header">
                    <h3><i class="fas fa-project-diagram"></i> Skill Dependencies</h3>
                    <div class="dependency-summary">
                        <span class="summary-item">
                            <i class="fas fa-file-code"></i> ${summary.totalSkills} skills
                        </span>
                        <span class="summary-item">
                            <i class="fas fa-link"></i> ${summary.totalDependencies || 0} dependencies
                        </span>
                        ${summary.missingSkills > 0 ? `
                            <span class="summary-item error">
                                <i class="fas fa-times-circle"></i> ${summary.missingSkills} missing
                            </span>
                        ` : ''}
                        ${summary.circularDeps > 0 ? `
                            <span class="summary-item error">
                                <i class="fas fa-circle-notch"></i> ${summary.circularDeps} circular
                            </span>
                        ` : ''}
                        ${summary.unusedSkills > 0 ? `
                            <span class="summary-item info">
                                <i class="fas fa-info-circle"></i> ${summary.unusedSkills} unused
                            </span>
                        ` : ''}
                    </div>
                </div>
                
                <div class="dependency-content">
                    ${issues.length > 0 ? `
                        <div class="dependency-section issues-section">
                            <h4><i class="fas fa-exclamation-triangle"></i> Dependency Issues</h4>
                            ${issues.map((issue, idx) => `
                                <div class="dependency-issue ${issue.severity}" data-issue-index="${idx}">
                                    <div class="issue-header">
                                        <span class="issue-type">${issue.type}</span>
                                        <span class="issue-severity ${issue.severity}">${issue.severity}</span>
                                    </div>
                                    <div class="issue-message">${issue.message}</div>
                                    ${issue.suggestion ? `
                                        <div class="issue-suggestion">
                                            <i class="fas fa-lightbulb"></i> ${issue.suggestion}
                                        </div>
                                    ` : ''}
                                    ${issue.cycle ? `
                                        <div class="issue-cycle">
                                            ${issue.cycle.join(' → ')}
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="dependency-section graph-section">
                        <h4><i class="fas fa-sitemap"></i> Dependency Graph</h4>
                        ${this.renderDependencyGraph(graphData)}
                    </div>
                    
                    <div class="dependency-section details-section">
                        <h4><i class="fas fa-list"></i> Skill Details</h4>
                        <div class="dependency-list">
                            ${Object.entries(dependencies).map(([skill, deps]) => {
                                const usedBy = usages[skill] || [];
                                return `
                                    <div class="dependency-item">
                                        <div class="dependency-skill-name">
                                            <i class="fas fa-magic"></i>
                                            <strong>${skill}</strong>
                                        </div>
                                        ${deps.length > 0 ? `
                                            <div class="dependency-refs">
                                                <span class="ref-label">References:</span>
                                                ${deps.map(dep => `<span class="ref-tag">${dep}</span>`).join('')}
                                            </div>
                                        ` : '<div class="dependency-refs no-deps">No dependencies</div>'}
                                        ${usedBy.length > 0 ? `
                                            <div class="dependency-usages">
                                                <span class="ref-label">Used by:</span>
                                                ${usedBy.map(user => `<span class="ref-tag usage">${user}</span>`).join('')}
                                            </div>
                                        ` : '<div class="dependency-usages no-usage">Not used by other skills</div>'}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderDependencyGraph(graphData) {
        const { nodes, edges } = graphData;
        
        if (nodes.length === 0) {
            return '<div class="graph-empty">No skills to visualize</div>';
        }
        
        // Simple text-based visualization
        return `
            <div class="dependency-graph-visual">
                ${nodes.map(node => {
                    const outgoing = edges.filter(e => e.from === node.id);
                    const incoming = edges.filter(e => e.to === node.id);
                    
                    let nodeClass = 'node';
                    if (node.isEntryPoint) nodeClass += ' entry-point';
                    if (node.isLeaf) nodeClass += ' leaf';
                    if (node.isIsolated) nodeClass += ' isolated';
                    
                    return `
                        <div class="${nodeClass}">
                            <div class="node-header">
                                <span class="node-name">${node.name}</span>
                                <span class="node-stats">
                                    ${incoming.length > 0 ? `<span class="incoming" title="Used by ${incoming.length} skill(s)">↓${incoming.length}</span>` : ''}
                                    ${outgoing.length > 0 ? `<span class="outgoing" title="References ${outgoing.length} skill(s)">↑${outgoing.length}</span>` : ''}
                                </span>
                            </div>
                            ${outgoing.length > 0 ? `
                                <div class="node-dependencies">
                                    ${outgoing.map(edge => `
                                        <div class="dependency-edge">
                                            <i class="fas fa-arrow-right"></i>
                                            <span>${edge.toSkill}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    renderSkillLinesList() {
        const lines = this.context === 'mob' ? this.skillLines : this.getSkillLines();
        if (lines.length === 0) {
            const emptyMsg = this.context === 'skill' 
                ? `No lines in skill "${this.currentSkill}". Click "Add Skill Line" to create one.`
                : 'No skill lines configured. Click "Add Skill Line" to create one.';
            return `<div class="empty-state">${emptyMsg}</div>`;
        }
        
        if (this.showGroups && this.groups.length > 0) {
            return this.renderGroupedView();
        } else {
            return this.renderFlatView();
        }
    }
    
    renderFlatView() {
        const lines = this.context === 'mob' ? this.skillLines : this.getSkillLines();
        return lines.map((line, index) => {
            return this.renderSkillLineCard(line, index, false);
        }).join('');
    }
    
    renderGroupedView() {
        const renderedIndices = new Set();
        let html = '';
        const lines = this.context === 'mob' ? this.skillLines : this.getSkillLines();
        
        // Render groups first
        this.groups.forEach((group, groupIndex) => {
            const isCollapsed = this.collapsedGroups.has(groupIndex);
            const groupIcon = this.groupDetector.getGroupIcon(group.type);
            const groupLabel = this.groupDetector.getGroupLabel(group.type);
            const suggestions = this.groupDetector.getGroupSuggestions(group, lines);
            
            // Mark all group members as rendered
            group.members.forEach(idx => renderedIndices.add(idx));
            
            html += `
                <div class="skill-group" data-group-index="${groupIndex}">
                    <div class="skill-group-header ${isCollapsed ? 'collapsed' : ''}" data-group-index="${groupIndex}">
                        <button class="btn-icon toggle-group-btn" data-group-index="${groupIndex}" title="${isCollapsed ? 'Expand' : 'Collapse'} group">
                            <i class="fas fa-chevron-${isCollapsed ? 'right' : 'down'}"></i>
                        </button>
                        <span class="group-icon" title="${groupLabel}">${groupIcon}</span>
                        <span class="group-label">${groupLabel}</span>
                        <span class="group-member-count">${group.members.length} line${group.members.length !== 1 ? 's' : ''}</span>
                        ${suggestions.length > 0 ? `
                            <span class="group-suggestions-badge" title="${suggestions.length} suggestion${suggestions.length !== 1 ? 's' : ''}">
                                <i class="fas fa-lightbulb"></i> ${suggestions.length}
                            </span>
                        ` : ''}
                        <div class="group-actions">
                            <button class="btn-icon duplicate-group-btn" data-group-index="${groupIndex}" title="Duplicate group">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button class="btn-icon delete-group-btn" data-group-index="${groupIndex}" title="Delete group">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="skill-group-body ${isCollapsed ? 'collapsed' : ''}">
                        ${suggestions.length > 0 ? `
                            <div class="group-suggestions">
                                ${suggestions.map(s => `
                                    <div class="suggestion ${s.type}" title="${s.message}">
                                        <i class="fas fa-lightbulb"></i>
                                        <span>${s.message}</span>
                                        ${s.template ? `
                                            <button class="btn-sm add-suggested-line-btn" data-group-index="${groupIndex}" data-template="${this.escapeHtml(s.template)}">
                                                Add
                                            </button>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        ${group.members.map(memberIndex => {
                            const isParent = memberIndex === group.parentIndex;
                            return this.renderSkillLineCard(lines[memberIndex], memberIndex, true, isParent);
                        }).join('')}
                    </div>
                </div>
            `;
        });
        
        // Render ungrouped lines
        lines.forEach((line, index) => {
            if (!renderedIndices.has(index)) {
                html += this.renderSkillLineCard(line, index, false);
            }
        });
        
        return html;
    }
    
    renderSkillLineCard(line, index, inGroup, isParent = false) {
        // Validate each skill line
        const parsed = SkillLineParser.parse(line);
        const validation = SkillLineValidator.validate(parsed, this.context);
        
        let validationClass = '';
        let validationIcon = '';
        let validationTooltip = '';
        
        if (validation.valid) {
            validationClass = 'valid';
            validationIcon = '<span class="validation-icon valid" title="Valid">✅</span>';
            validationTooltip = 'Valid skill line';
        } else if (validation.errors.length > 0) {
            validationClass = 'error';
            validationIcon = '<span class="validation-icon error" title="Has errors">❌</span>';
            validationTooltip = validation.errors.join('\n');
        } else if (validation.warnings.length > 0) {
            validationClass = 'warning';
            validationIcon = '<span class="validation-icon warning" title="Has warnings">⚠️</span>';
            validationTooltip = validation.warnings.join('\n');
        }
        
        return `
            <div class="skill-line-card ${validationClass} ${inGroup ? 'in-group' : ''} ${isParent ? 'parent' : ''}" data-index="${index}" draggable="true" title="${validationTooltip}">
                <div class="skill-line-grip">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="skill-line-content">
                    ${validationIcon}
                    ${isParent ? '<span class="parent-badge" title="Parent skill">P</span>' : ''}
                    <code class="skill-line-preview">${this.syntaxHighlighter.highlight(line)}</code>
                </div>
                <div class="skill-line-actions">
                    <button class="btn-icon quick-edit-skill-line-btn" data-index="${index}" title="Quick Edit">
                        <i class="fas fa-bolt"></i>
                    </button>
                    <button class="btn-icon format-skill-line-btn" data-index="${index}" title="Format Line">
                        <i class="fas fa-magic"></i>
                    </button>
                    <button class="btn-icon edit-skill-line-btn" data-index="${index}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon duplicate-skill-line-btn" data-index="${index}" title="Duplicate">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn-icon delete-skill-line-btn" data-index="${index}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Render duplicate detection panel
     */
    renderDuplicatePanel() {
        const { duplicates, similarGroups, summary } = this.duplicateResults;
        
        return `
            <div class="duplicate-panel">
                <div class="duplicate-header">
                    <h3 class="duplicate-title">
                        <i class="fas fa-clone"></i>
                        Duplicate Detection
                    </h3>
                    <div class="duplicate-summary">
                        <div class="dup-stat">
                            <div class="dup-stat-label">Exact Duplicates</div>
                            <div class="dup-stat-value ${summary.exactDuplicates > 0 ? 'warning' : ''}">${summary.exactDuplicates}</div>
                        </div>
                        <div class="dup-stat">
                            <div class="dup-stat-label">Similar Groups</div>
                            <div class="dup-stat-value ${summary.similarGroups > 0 ? 'info' : ''}">${summary.similarGroups}</div>
                        </div>
                        <div class="dup-stat">
                            <div class="dup-stat-label">Total Lines</div>
                            <div class="dup-stat-value">${summary.totalLines}</div>
                        </div>
                        <div class="dup-stat">
                            <div class="dup-stat-label">Potential Savings</div>
                            <div class="dup-stat-value success">${summary.potentialSavings} lines</div>
                        </div>
                    </div>
                </div>
                
                <div class="duplicate-content">
                    ${duplicates.length > 0 ? `
                        <div class="duplicate-section">
                            <h4 class="duplicate-section-title">
                                <i class="fas fa-exclamation-triangle"></i>
                                Exact Duplicates
                            </h4>
                            ${duplicates.map((dup, idx) => `
                                <div class="duplicate-group exact">
                                    <div class="duplicate-group-header">
                                        <span class="duplicate-count">${dup.count}x</span>
                                        <code class="duplicate-line">${this.escapeHtml(dup.line)}</code>
                                    </div>
                                    <div class="duplicate-details">
                                        <div class="duplicate-indices">
                                            <strong>Lines:</strong>
                                            ${dup.indices.map(i => `<span class="line-ref" data-line="${i}">Line ${i + 1}</span>`).join(', ')}
                                        </div>
                                        <div class="duplicate-suggestion">
                                            <i class="fas fa-lightbulb"></i>
                                            ${dup.suggestion}
                                        </div>
                                        <div class="duplicate-actions">
                                            <button class="btn-sm view-consolidation-btn" data-dup-index="${idx}">
                                                <i class="fas fa-compress"></i>
                                                View Consolidation Options
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${similarGroups.length > 0 ? `
                        <div class="duplicate-section">
                            <h4 class="duplicate-section-title">
                                <i class="fas fa-code-branch"></i>
                                Similar Mechanics
                            </h4>
                            ${similarGroups.map((group, idx) => `
                                <div class="duplicate-group similar">
                                    <div class="duplicate-group-header">
                                        <span class="similarity-badge">${Math.round(group.averageSimilarity * 100)}% similar</span>
                                        <span class="similar-count">${group.similarLines.length + 1} lines</span>
                                    </div>
                                    <div class="duplicate-details">
                                        <div class="similar-base">
                                            <strong>Base Line ${group.baseIndex + 1}:</strong>
                                            <code>${this.escapeHtml(group.baseLine)}</code>
                                        </div>
                                        <div class="similar-matches">
                                            ${group.similarLines.map(similar => `
                                                <div class="similar-match">
                                                    <div class="similar-line">
                                                        <span class="similarity-percent">${Math.round(similar.similarity * 100)}%</span>
                                                        <span class="line-ref" data-line="${similar.index}">Line ${similar.index + 1}:</span>
                                                        <code>${this.escapeHtml(similar.line)}</code>
                                                    </div>
                                                    ${similar.differences.length > 0 ? `
                                                        <div class="differences">
                                                            <strong>Differences:</strong>
                                                            ${similar.differences.map(diff => `
                                                                <div class="diff-item">
                                                                    <span class="diff-type">${diff.type}:</span>
                                                                    ${diff.attribute ? `<span class="diff-attr">${diff.attribute}:</span>` : ''}
                                                                    <span class="diff-val">${diff.value1}</span>
                                                                    <i class="fas fa-arrow-right"></i>
                                                                    <span class="diff-val">${diff.value2}</span>
                                                                </div>
                                                            `).join('')}
                                                        </div>
                                                    ` : ''}
                                                </div>
                                            `).join('')}
                                        </div>
                                        <div class="duplicate-suggestion">
                                            <i class="fas fa-lightbulb"></i>
                                            ${group.suggestion}
                                        </div>
                                        <div class="duplicate-actions">
                                            <button class="btn-sm view-consolidation-btn" data-group-index="${idx}">
                                                <i class="fas fa-compress"></i>
                                                View Consolidation Options
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${duplicates.length === 0 && similarGroups.length === 0 ? `
                        <div class="duplicate-empty">
                            <i class="fas fa-check-circle"></i>
                            <p>No duplicates or similar mechanics detected!</p>
                            <p class="empty-subtext">Your skill lines are unique and well-optimized.</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Escape HTML for safe display
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    attachEventListeners() {
        if (!this.container) return;
        
        // Toggle groups button
        const toggleGroupsBtn = this.container.querySelector('#toggle-groups-btn');
        if (toggleGroupsBtn) {
            toggleGroupsBtn.addEventListener('click', () => {
                this.showGroups = !this.showGroups;
                this.render();
            });
        }
        
        // Toggle insights button (merged analysis + problems)
        const toggleInsightsBtn = this.container.querySelector('#toggle-insights-btn');
        if (toggleInsightsBtn) {
            toggleInsightsBtn.addEventListener('click', () => {
                this.showAnalysis = !this.showAnalysis;
                this.render();
            });
        }
        
        // Toggle dependencies button
        const toggleDependenciesBtn = this.container.querySelector('#toggle-dependencies-btn');
        if (toggleDependenciesBtn) {
            toggleDependenciesBtn.addEventListener('click', () => {
                this.showDependencies = !this.showDependencies;
                this.render();
            });
        }
        
        // Undo button
        const undoBtn = this.container.querySelector('.undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                if (this.historyManager) {
                    this.historyManager.undo();
                }
            });
        }
        
        // Redo button
        const redoBtn = this.container.querySelector('.redo-btn');
        if (redoBtn) {
            redoBtn.addEventListener('click', () => {
                if (this.historyManager) {
                    this.historyManager.redo();
                }
            });
        }
        
        // Format all button
        const formatAllBtn = this.container.querySelector('#format-all-btn');
        if (formatAllBtn) {
            formatAllBtn.addEventListener('click', () => {
                this.formatAllLines();
            });
        }
        
        // Toggle duplicates button
        const toggleDuplicatesBtn = this.container.querySelector('#toggle-duplicates-btn');
        if (toggleDuplicatesBtn) {
            toggleDuplicatesBtn.addEventListener('click', () => {
                this.showDuplicates = !this.showDuplicates;
                this.render();
            });
        }
        
        // Jump to line buttons in analysis panel
        this.container.querySelectorAll('.jump-to-line-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const lineIndex = parseInt(btn.dataset.lineIndex);
                this.jumpToLine(lineIndex);
            });
        });
        
        // Toggle individual group collapse
        this.container.querySelectorAll('.toggle-group-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const groupIndex = parseInt(btn.dataset.groupIndex);
                if (this.collapsedGroups.has(groupIndex)) {
                    this.collapsedGroups.delete(groupIndex);
                } else {
                    this.collapsedGroups.add(groupIndex);
                }
                this.render();
            });
        });
        
        // Group header click to toggle
        this.container.querySelectorAll('.skill-group-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (e.target.closest('.btn-icon')) return; // Ignore button clicks
                const groupIndex = parseInt(header.dataset.groupIndex);
                if (this.collapsedGroups.has(groupIndex)) {
                    this.collapsedGroups.delete(groupIndex);
                } else {
                    this.collapsedGroups.add(groupIndex);
                }
                this.render();
            });
        });
        
        // Duplicate group buttons
        this.container.querySelectorAll('.duplicate-group-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const groupIndex = parseInt(btn.dataset.groupIndex);
                this.duplicateGroup(groupIndex);
            });
        });
        
        // Delete group buttons
        this.container.querySelectorAll('.delete-group-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const groupIndex = parseInt(btn.dataset.groupIndex);
                if (confirm('Delete entire group?')) {
                    this.deleteGroup(groupIndex);
                }
            });
        });
        
        // View consolidation options buttons
        this.container.querySelectorAll('.view-consolidation-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dupIndex = btn.dataset.dupIndex;
                const groupIndex = btn.dataset.groupIndex;
                
                if (dupIndex !== undefined) {
                    // Exact duplicate
                    const duplicate = this.duplicateResults.duplicates[parseInt(dupIndex)];
                    this.showConsolidationModal(duplicate);
                } else if (groupIndex !== undefined) {
                    // Similar group
                    const group = this.duplicateResults.similarGroups[parseInt(groupIndex)];
                    this.showConsolidationModal(group);
                }
            });
        });
        
        // Line reference clicks in duplicate panel
        this.container.querySelectorAll('.line-ref').forEach(ref => {
            ref.addEventListener('click', (e) => {
                const lineIndex = parseInt(ref.dataset.line);
                this.jumpToLine(lineIndex);
            });
        });
        
        // Add suggested line buttons
        this.container.querySelectorAll('.add-suggested-line-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const groupIndex = parseInt(btn.dataset.groupIndex);
                const template = btn.dataset.template;
                this.addSuggestedLine(groupIndex, template);
            });
        });
        
        // Add skill line button
        const addBtn = this.container.querySelector('#add-skill-line-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addSkillLine());
        }
        
        // Quick edit skill line buttons
        this.container.querySelectorAll('.quick-edit-skill-line-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                this.quickEditSkillLine(index, e.target.closest('button'));
            });
        });
        
        // Format skill line buttons
        this.container.querySelectorAll('.format-skill-line-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                this.formatLine(index);
            });
        });
        
        // Edit skill line buttons
        this.container.querySelectorAll('.edit-skill-line-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                this.editSkillLine(index);
            });
        });
        
        // Duplicate skill line buttons
        this.container.querySelectorAll('.duplicate-skill-line-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                this.duplicateSkillLine(index);
            });
        });
        
        // Delete skill line buttons
        this.container.querySelectorAll('.delete-skill-line-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                console.log('🗑️ Deleting skill line at index:', index);
                
                if (this.context === 'mob') {
                    console.log('Before delete:', this.skillLines.length, 'lines');
                    console.log('Deleting line:', this.skillLines[index]);
                } else {
                    console.log('Before delete:', this.skills[this.currentSkill].lines.length, 'lines');
                    console.log('Deleting line:', this.skills[this.currentSkill].lines[index]);
                }
                
                if (this.context === 'mob') {
                    this.skillLines.splice(index, 1);
                    console.log('After delete:', this.skillLines.length, 'lines');
                } else {
                    this.skills[this.currentSkill].lines.splice(index, 1);
                    console.log('After delete:', this.skills[this.currentSkill].lines.length, 'lines');
                }
                this.render(); // render() already calls attachEventListeners()
                this.triggerChange();
            });
        });
        
        // Drag and drop for reordering
        this.setupDragAndDrop();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }
    
    /**
     * Setup drag and drop for reordering skill lines
     */
    setupDragAndDrop() {
        const cards = this.container.querySelectorAll('.skill-line-card');
        let draggedIndex = null;
        
        cards.forEach((card, index) => {
            card.addEventListener('dragstart', (e) => {
                draggedIndex = index;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            
            card.addEventListener('dragend', (e) => {
                card.classList.remove('dragging');
                draggedIndex = null;
            });
            
            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                const afterElement = this.getDragAfterElement(card.parentElement, e.clientY);
                if (afterElement == null) {
                    card.parentElement.appendChild(card);
                } else {
                    card.parentElement.insertBefore(card, afterElement);
                }
            });
            
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedIndex === null) return;
                
                const dropIndex = parseInt(card.dataset.index);
                if (draggedIndex !== dropIndex) {
                    if (this.context === 'mob') {
                        const [movedLine] = this.skillLines.splice(draggedIndex, 1);
                        this.skillLines.splice(dropIndex, 0, movedLine);
                    } else {
                        const [movedLine] = this.skills[this.currentSkill].lines.splice(draggedIndex, 1);
                        this.skills[this.currentSkill].lines.splice(dropIndex, 0, movedLine);
                    }
                    this.render();
                    this.triggerChange();
                }
            });
        });
    }
    
    /**
     * Get element after which to insert dragged element
     */
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.skill-line-card:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        this.container.addEventListener('keydown', (e) => {
            // Delete key on focused card
            if (e.key === 'Delete') {
                const focused = document.activeElement;
                if (focused && focused.classList.contains('skill-line-card')) {
                    const index = parseInt(focused.dataset.index);
                    if (confirm('Delete this skill line?')) {
                        if (this.context === 'mob') {
                            this.skillLines.splice(index, 1);
                        } else {
                            this.skills[this.currentSkill].lines.splice(index, 1);
                        }
                        this.render();
                        this.triggerChange();
                    }
                }
            }
            
            // Ctrl+D to duplicate
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                const focused = document.activeElement;
                if (focused && focused.classList.contains('skill-line-card')) {
                    const index = parseInt(focused.dataset.index);
                    this.duplicateSkillLine(index);
                }
            }
        });
    }
    
    // Add new skill line
    addSkillLine() {
        console.log('🔧 addSkillLine called - Opening Creation Mode Selector');
        
        // Open creation mode selector
        this.creationModeSelector.open({
            context: this.context,
            onSelect: (mode) => {
                console.log('✅ Mode selected:', mode);
                this.handleModeSelection(mode);
            }
        });
    }
    
    // Handle mode selection from creation mode selector
    handleModeSelection(mode) {
        switch (mode) {
            case 'templates':
                this.showTemplateSelector();
                break;
            case 'builder':
                this.showSkillLineBuilder();
                break;
            case 'manual':
                this.showManualEntry();
                break;
            default:
                console.error('Unknown mode:', mode);
        }
    }
    
    // Show template selector (quick templates)
    showTemplateSelector() {
        console.log('🎁 Opening Template Selector');
        
        this.templateSelector.open({
            context: this.context,
            onSelect: (skillLines) => {
                this.handleMultipleSkillLines(Array.isArray(skillLines) ? skillLines : [skillLines]);
            },
            onBack: () => {
                // Reopen creation mode selector
                this.addSkillLine();
            }
        });
    }
    
    // Show skill line builder (unified builder with all tabs)
    showSkillLineBuilder() {
        console.log('🛠️ Opening Skill Line Builder');
        
        this.skillLineBuilder.open({
            context: this.context,
            onAdd: (skillLine) => {
                // Single line callback
                this.handleMultipleSkillLines([skillLine]);
            },
            onAddMultiple: (skillLines) => {
                // Multiple lines callback (from queue)
                this.handleMultipleSkillLines(skillLines);
            },
            onBack: () => {
                // Reopen creation mode selector
                this.addSkillLine();
            }
        });
    }
    
    // Show manual entry editor (direct YAML input)
    showManualEntry() {
        console.log('📝 Opening Manual Entry Editor');
        
        // Create a simple modal for manual YAML entry
        const modal = document.createElement('div');
        modal.className = 'condition-modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="width: 800px; max-width: 90vw;">
                <div class="modal-header">
                    <button class="btn btn-secondary btn-back" id="manualEntryBack" title="Back to options">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    <h2>Manual Skill Line Entry</h2>
                    <button class="btn-close">&times;</button>
                </div>
                <div class="modal-body" style="padding: var(--spacing-lg);">
                    <p class="help-text" style="margin-bottom: var(--spacing-md);">
                        Enter skill lines in MythicMobs YAML format. Each line should start with "- " and contain a mechanic.
                        You can add multiple lines at once (one per line).
                    </p>
                    <textarea id="manual-skill-input" 
                              style="width: 100%; min-height: 300px; font-family: 'Courier New', monospace; 
                                     padding: var(--spacing-md); border: 2px solid var(--border-primary); 
                                     border-radius: var(--radius-md); background: var(--bg-secondary); 
                                     color: var(--text-primary); resize: vertical;"
                              placeholder="- damage{amount=10} @target&#10;- message{msg=&quot;Hello!&quot;} @trigger&#10;- effect:particles{particle=flame} @self"></textarea>
                    <div style="margin-top: var(--spacing-md); display: flex; gap: var(--spacing-sm); justify-content: flex-end;">
                        <button class="btn btn-secondary" id="manual-cancel">Cancel</button>
                        <button class="btn btn-primary" id="manual-add">
                            <i class="fas fa-plus"></i> Add Lines
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const textarea = modal.querySelector('#manual-skill-input');
        const closeBtn = modal.querySelector('.btn-close');
        const backBtn = modal.querySelector('#manualEntryBack');
        const cancelBtn = modal.querySelector('#manual-cancel');
        const addBtn = modal.querySelector('#manual-add');
        
        const closeModal = () => {
            modal.remove();
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        backBtn.addEventListener('click', () => {
            closeModal();
            // Reopen creation mode selector
            this.addSkillLine();
        });
        
        addBtn.addEventListener('click', () => {
            const input = textarea.value.trim();
            if (!input) {
                alert('Please enter at least one skill line');
                return;
            }
            
            // Split by newlines and filter out empty lines
            const lines = input.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
            
            if (lines.length === 0) {
                alert('Please enter at least one skill line');
                return;
            }
            
            // Add the lines
            this.handleMultipleSkillLines(lines);
            closeModal();
        });
        
        // Focus the textarea
        setTimeout(() => textarea.focus(), 100);
        
        // Close on escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }
    
    // Handle adding multiple skill lines at once
    handleMultipleSkillLines(skillLines) {
        if (!Array.isArray(skillLines) || skillLines.length === 0) {
            console.warn('⚠️ No skill lines to add');
            return;
        }
        
        console.log('📥 Adding skill lines:', skillLines);
        
        if (this.context === 'mob') {
            // Mob context: add to flat array
            const beforeCount = this.skillLines.length;
            this.skillLines.push(...skillLines);
            console.log(`📊 Before: ${beforeCount}, After: ${this.skillLines.length}`);
        } else {
            // Skill context: add to current skill
            if (!this.skills[this.currentSkill]) {
                this.skills[this.currentSkill] = { lines: [] };
            }
            const beforeCount = this.skills[this.currentSkill].lines.length;
            this.skills[this.currentSkill].lines.push(...skillLines);
            console.log(`📊 Before: ${beforeCount}, After: ${this.skills[this.currentSkill].lines.length}`);
        }
        
        this.render(); // render() already calls attachEventListeners()
        this.triggerChange();
        
        console.log(`✅ Added ${skillLines.length} skill line(s)`);
    }
    
    // Quick edit skill line with popover
    quickEditSkillLine(index, buttonElement) {
        const lines = this.context === 'mob' ? this.skillLines : this.getSkillLines();
        const line = lines[index];
        
        this.quickEdit.open({
            line: line,
            index: index,
            anchorElement: buttonElement,
            onSave: (newLine, idx) => {
                if (this.context === 'mob') {
                    this.skillLines[idx] = newLine;
                } else {
                    this.skills[this.currentSkill].lines[idx] = newLine;
                }
                this.render();
                this.triggerChange();
            }
        });
    }
    
    // Edit existing skill line
    editSkillLine(index) {
        const lines = this.context === 'mob' ? this.skillLines : this.getSkillLines();
        const currentLine = lines[index];
        
        // Use custom editor for editing - it's the most flexible
        this.customEditor.open({
            context: this.context,
            onAdd: (skillLine) => {
                if (this.context === 'mob') {
                    this.skillLines[index] = skillLine;
                } else {
                    this.skills[this.currentSkill].lines[index] = skillLine;
                }
                this.render();
                this.attachEventListeners();
                this.triggerChange();
            }
        });
        
        // Pre-fill the custom editor with current line
        setTimeout(() => {
            if (this.customEditor.input) {
                this.customEditor.input.value = currentLine;
                this.customEditor.currentInput = currentLine;
                this.customEditor.applySyntaxHighlighting();
                this.customEditor.updateValidation();
                this.customEditor.updatePreview();
                this.customEditor.updateAddButton();
            }
        }, 100);
    }
    
    // Parse skill line into components for editing
    parseSkillLine(line) {
        // Simple parser - in real implementation this would be more robust
        const result = {
            mechanic: '',
            args: {},
            targeter: '@Self',
            trigger: '',
            condition: '',
            chance: '',
            healthModifier: ''
        };
        
        // Extract mechanic and args: - mechanic{args}
        const mechanicMatch = line.match(/^-\s*([a-zA-Z]+)(?:\{([^}]*)\})?/);
        if (mechanicMatch) {
            result.mechanic = mechanicMatch[1];
            if (mechanicMatch[2]) {
                // Parse args (simplified)
                mechanicMatch[2].split(';').forEach(arg => {
                    const [key, value] = arg.split('=').map(s => s.trim());
                    if (key && value) {
                        result.args[key] = value;
                    }
                });
            }
        }
        
        // Extract targeter: @targeter
        const targeterMatch = line.match(/@([^\s~?]+)/);
        if (targeterMatch) {
            result.targeter = '@' + targeterMatch[1];
        }
        
        // Extract trigger: ~trigger
        const triggerMatch = line.match(/~([^\s?]+)/);
        if (triggerMatch) {
            result.trigger = '~' + triggerMatch[1];
        }
        
        // Extract condition: ?condition
        const conditionMatch = line.match(/\?([^\s]+)/);
        if (conditionMatch) {
            result.condition = '?' + conditionMatch[1];
        }
        
        // Extract chance (last numeric before health modifier)
        const chanceMatch = line.match(/\s+([\d.]+)(?:\s+[\d.]+)?$/);
        if (chanceMatch) {
            result.chance = chanceMatch[1];
        }
        
        // Extract health modifier (last numeric)
        const healthMatch = line.match(/\s+([\d.]+)$/);
        if (healthMatch) {
            result.healthModifier = healthMatch[1];
        }
        
        return result;
    }
    
    // Duplicate skill line
    duplicateSkillLine(index) {
        if (this.context === 'mob') {
            const duplicate = this.skillLines[index];
            this.skillLines.splice(index + 1, 0, duplicate);
        } else {
            const duplicate = this.skills[this.currentSkill].lines[index];
            this.skills[this.currentSkill].lines.splice(index + 1, 0, duplicate);
        }
        this.render();
        this.triggerChange();
    }
    
    // Duplicate entire group
    duplicateGroup(groupIndex) {
        const group = this.groups[groupIndex];
        if (!group) return;
        
        // Get all lines in the group
        const lines = this.context === 'mob' ? this.skillLines : this.getSkillLines();
        const groupLines = group.members.map(idx => lines[idx]);
        
        // Insert duplicates after the last member
        const lastMemberIndex = Math.max(...group.members);
        if (this.context === 'mob') {
            this.skillLines.splice(lastMemberIndex + 1, 0, ...groupLines);
        } else {
            this.skills[this.currentSkill].lines.splice(lastMemberIndex + 1, 0, ...groupLines);
        }
        
        this.render();
        this.triggerChange();
    }
    
    // Delete entire group
    deleteGroup(groupIndex) {
        const group = this.groups[groupIndex];
        if (!group) return;
        
        // Sort indices in reverse to delete from end to start
        const sortedIndices = [...group.members].sort((a, b) => b - a);
        sortedIndices.forEach(idx => {
            if (this.context === 'mob') {
                this.skillLines.splice(idx, 1);
            } else {
                this.skills[this.currentSkill].lines.splice(idx, 1);
            }
        });
        
        this.render();
        this.triggerChange();
    }
    
    // Add suggested line to group
    addSuggestedLine(groupIndex, template) {
        const group = this.groups[groupIndex];
        if (!group) return;
        
        // Insert after last member of group
        const lastMemberIndex = Math.max(...group.members);
        if (this.context === 'mob') {
            this.skillLines.splice(lastMemberIndex + 1, 0, template);
        } else {
            this.skills[this.currentSkill].lines.splice(lastMemberIndex + 1, 0, template);
        }
        
        this.render();
        this.triggerChange();
    }
    
    // Show consolidation modal
    showConsolidationModal(duplicateOrGroup) {
        const suggestions = this.duplicateDetector.getConsolidationSuggestions(duplicateOrGroup);
        
        const modal = document.createElement('div');
        modal.className = 'consolidation-modal';
        modal.innerHTML = `
            <div class="consolidation-modal-overlay"></div>
            <div class="consolidation-modal-content">
                <div class="consolidation-modal-header">
                    <h3>
                        <i class="fas fa-compress"></i>
                        Consolidation Options
                    </h3>
                    <button class="btn-icon close-modal-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="consolidation-modal-body">
                    ${suggestions.map(suggestion => `
                        <div class="consolidation-option">
                            <h4 class="option-method">
                                <i class="fas fa-${suggestion.method === 'metaskill' ? 'cube' : suggestion.method === 'variable' ? 'dollar-sign' : suggestion.method === 'parameterized-metaskill' ? 'sliders-h' : 'code-branch'}"></i>
                                ${this.formatMethodName(suggestion.method)}
                            </h4>
                            <p class="option-description">${suggestion.description}</p>
                            <div class="option-example">
                                <strong>Example:</strong>
                                <pre><code>${this.escapeHtml(suggestion.example)}</code></pre>
                            </div>
                            <div class="option-benefit">
                                <i class="fas fa-check-circle"></i>
                                <strong>Benefit:</strong> ${suggestion.benefit}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="consolidation-modal-footer">
                    <button class="btn btn-secondary close-modal-btn">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal handlers
        modal.querySelectorAll('.close-modal-btn, .consolidation-modal-overlay').forEach(el => {
            el.addEventListener('click', () => {
                modal.classList.add('fade-out');
                setTimeout(() => modal.remove(), 300);
            });
        });
    }
    
    // Format method name for display
    formatMethodName(method) {
        return method
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    // Format all skill lines
    formatAllLines() {
        if (this.context === 'mob') {
            // Format flat array of lines
            this.skillLines = this.skillLines.map(line => this.formatter.formatLine(line));
        } else {
            // Format lines in current skill
            if (this.skills[this.currentSkill] && this.skills[this.currentSkill].lines) {
                this.skills[this.currentSkill].lines = this.skills[this.currentSkill].lines.map(
                    line => this.formatter.formatLine(line)
                );
            }
        }
        
        this.render();
        this.attachEventListeners();
        this.triggerChange();
        
        // Show notification
        this.showFormatNotification();
    }
    
    // Format a single skill line
    formatLine(index) {
        if (this.context === 'mob') {
            if (index >= 0 && index < this.skillLines.length) {
                this.skillLines[index] = this.formatter.formatLine(this.skillLines[index]);
            }
        } else {
            if (this.skills[this.currentSkill] && this.skills[this.currentSkill].lines) {
                const lines = this.skills[this.currentSkill].lines;
                if (index >= 0 && index < lines.length) {
                    lines[index] = this.formatter.formatLine(lines[index]);
                }
            }
        }
        
        this.render();
        this.attachEventListeners();
        this.triggerChange();
    }
    
    // Show format notification
    showFormatNotification() {
        const notification = document.createElement('div');
        notification.className = 'format-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>All lines formatted successfully</span>
        `;
        
        this.container.appendChild(notification);
        
        // Auto-dismiss after 2 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
    
    getValue() {
        // Context-aware: return appropriate data structure
        if (this.context === 'mob') {
            return this.skillLines;
        } else {
            return this.getSkillLines();
        }
    }
    
    setValue(skillLines) {
        if (this.context === 'mob') {
            // Mob context: set flat array
            this.skillLines = skillLines || [];
        } else {
            // Skill context: initialize with lines in current skill
            if (!this.skills[this.currentSkill]) {
                this.skills[this.currentSkill] = { lines: [] };
            }
            this.skills[this.currentSkill].lines = skillLines || [];
        }
        this.render();
        this.attachEventListeners();
    }
    
    onChange(callback) {
        this.changeCallback = callback;
    }
    
    triggerChange() {
        // Save state to history (debounced to avoid too many snapshots)
        if (this.historyManager && !this.historyManager.isRestoring) {
            clearTimeout(this.historyDebounce);
            this.historyDebounce = setTimeout(() => {
                this.saveHistoryState('Edit');
            }, 500);
        }
        
        if (this.changeCallback) {
            if (this.context === 'mob') {
                this.changeCallback(this.skillLines);
            } else {
                // For skill context, return lines from current skill
                this.changeCallback(this.getSkillLines());
            }
        }
    }
    
    // Collect form data (for integration with parent forms)
    collectFormData() {
        if (this.context === 'mob') {
            return {
                skillLines: this.skillLines
            };
        } else {
            return {
                skills: this.skills
            };
        }
    }

    /**
     * Create a new skill
     */
    createNewSkill() {
        const skillName = prompt('Enter new skill name:');
        if (!skillName) return;
        
        // Validate skill name
        if (!/^[a-zA-Z0-9_]+$/.test(skillName)) {
            alert('Skill name must contain only letters, numbers, and underscores.');
            return;
        }
        
        // Check if skill already exists
        if (this.skills[skillName]) {
            alert('A skill with this name already exists.');
            return;
        }
        
        // Create new skill
        this.skills[skillName] = { lines: [] };
        this.currentSkill = skillName;
        this.render();
        this.triggerChange();
    }

    /**
     * Delete the current skill
     */
    deleteCurrentSkill() {
        const skillNames = Object.keys(this.skills);
        if (skillNames.length <= 1) {
            alert('Cannot delete the last skill. At least one skill must remain.');
            return;
        }
        
        if (!confirm(`Delete skill "${this.currentSkill}"?`)) {
            return;
        }
        
        delete this.skills[this.currentSkill];
        
        // Switch to first remaining skill
        this.currentSkill = Object.keys(this.skills)[0];
        this.render();
        this.triggerChange();
    }

    /**
     * Rename the current skill
     */
    renameCurrentSkill() {
        const newName = prompt('Enter new skill name:', this.currentSkill);
        if (!newName || newName === this.currentSkill) return;
        
        // Validate skill name
        if (!/^[a-zA-Z0-9_]+$/.test(newName)) {
            alert('Skill name must contain only letters, numbers, and underscores.');
            return;
        }
        
        // Check if skill already exists
        if (this.skills[newName]) {
            alert('A skill with this name already exists.');
            return;
        }
        
        // Rename skill
        this.skills[newName] = this.skills[this.currentSkill];
        delete this.skills[this.currentSkill];
        this.currentSkill = newName;
        this.render();
        this.triggerChange();
    }

    /**
     * Jump to and highlight a specific line
     */
    jumpToLine(lineIndex) {
        const card = this.container.querySelector(`.skill-line-card[data-index="${lineIndex}"]`);
        if (card) {
            // Scroll into view
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add highlight animation
            card.classList.add('highlight-flash');
            setTimeout(() => {
                card.classList.remove('highlight-flash');
            }, 2000);
        }
    }
}
