/**
 * Validation Panel
 * Dedicated persistent panel showing all errors, warnings, and info messages
 * Similar to VS Code's Problems panel
 */

class ValidationPanel {
    constructor(container) {
        this.container = container;
        this.problems = [];
        this.filter = 'all'; // 'all', 'errors', 'warnings', 'info'
        this.sortBy = 'severity'; // 'severity', 'line', 'type'
        this.onJumpToLineCallback = null;
        
        this.render();
        this.attachEventListeners();
    }

    /**
     * Update problems list
     */
    updateProblems(problems) {
        this.problems = problems;
        this.render();
    }

    /**
     * Set callback for jumping to line
     */
    onJumpToLine(callback) {
        this.onJumpToLineCallback = callback;
    }

    /**
     * Render the panel
     */
    render() {
        if (!this.container) return;

        const filtered = this.getFilteredProblems();
        const sorted = this.sortProblems(filtered);
        
        const counts = {
            errors: this.problems.filter(p => p.severity === 'error').length,
            warnings: this.problems.filter(p => p.severity === 'warning').length,
            info: this.problems.filter(p => p.severity === 'info').length
        };

        this.container.innerHTML = `
            <div class="validation-panel">
                <div class="validation-header">
                    <div class="validation-title">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Problems</span>
                        <span class="problem-count">${this.problems.length}</span>
                    </div>
                    <div class="validation-filters">
                        <button class="filter-btn ${this.filter === 'all' ? 'active' : ''}" data-filter="all" title="Show all">
                            <i class="fas fa-list"></i>
                            <span>All (${this.problems.length})</span>
                        </button>
                        <button class="filter-btn ${this.filter === 'errors' ? 'active' : ''}" data-filter="errors" title="Show errors only">
                            <i class="fas fa-times-circle"></i>
                            <span>${counts.errors}</span>
                        </button>
                        <button class="filter-btn ${this.filter === 'warnings' ? 'active' : ''}" data-filter="warnings" title="Show warnings only">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span>${counts.warnings}</span>
                        </button>
                        <button class="filter-btn ${this.filter === 'info' ? 'active' : ''}" data-filter="info" title="Show info only">
                            <i class="fas fa-info-circle"></i>
                            <span>${counts.info}</span>
                        </button>
                    </div>
                    <div class="validation-sort">
                        <select class="sort-select" id="validation-sort">
                            <option value="severity" ${this.sortBy === 'severity' ? 'selected' : ''}>Sort by Severity</option>
                            <option value="line" ${this.sortBy === 'line' ? 'selected' : ''}>Sort by Line</option>
                            <option value="type" ${this.sortBy === 'type' ? 'selected' : ''}>Sort by Type</option>
                        </select>
                    </div>
                </div>
                
                <div class="validation-content">
                    ${sorted.length === 0 ? `
                        <div class="validation-empty">
                            <i class="fas fa-check-circle"></i>
                            <p>No problems found</p>
                            <span>Your skill lines are looking good!</span>
                        </div>
                    ` : `
                        <div class="problem-list">
                            ${sorted.map((problem, idx) => this.renderProblem(problem, idx)).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    /**
     * Render a single problem item
     */
    renderProblem(problem, index) {
        const severityIcon = {
            'error': '<i class="fas fa-times-circle"></i>',
            'warning': '<i class="fas fa-exclamation-triangle"></i>',
            'info': '<i class="fas fa-info-circle"></i>'
        }[problem.severity] || '<i class="fas fa-circle"></i>';

        const lineText = problem.lineIndices && problem.lineIndices.length > 0
            ? `Line ${problem.lineIndices.map(i => i + 1).join(', ')}`
            : 'Multiple lines';

        return `
            <div class="problem-item ${problem.severity}" data-problem-index="${index}">
                <div class="problem-severity">
                    ${severityIcon}
                </div>
                <div class="problem-details">
                    <div class="problem-header">
                        <span class="problem-type">${problem.name || problem.type}</span>
                        <span class="problem-line">${lineText}</span>
                    </div>
                    <div class="problem-message">${problem.message}</div>
                    ${problem.suggestion ? `
                        <div class="problem-suggestion">
                            <i class="fas fa-lightbulb"></i>
                            ${problem.suggestion}
                        </div>
                    ` : ''}
                </div>
                <div class="problem-actions">
                    ${problem.lineIndices && problem.lineIndices.length > 0 ? `
                        <button class="btn-icon jump-btn" data-line-index="${problem.lineIndices[0]}" title="Jump to line">
                            <i class="fas fa-arrow-right"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Get filtered problems based on current filter
     */
    getFilteredProblems() {
        if (this.filter === 'all') {
            return this.problems;
        }
        return this.problems.filter(p => {
            if (this.filter === 'errors') return p.severity === 'error';
            if (this.filter === 'warnings') return p.severity === 'warning';
            if (this.filter === 'info') return p.severity === 'info';
            return true;
        });
    }

    /**
     * Sort problems
     */
    sortProblems(problems) {
        const sorted = [...problems];
        
        if (this.sortBy === 'severity') {
            const severityOrder = { 'error': 0, 'warning': 1, 'info': 2 };
            sorted.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
        } else if (this.sortBy === 'line') {
            sorted.sort((a, b) => {
                const aLine = a.lineIndices?.[0] ?? 999999;
                const bLine = b.lineIndices?.[0] ?? 999999;
                return aLine - bLine;
            });
        } else if (this.sortBy === 'type') {
            sorted.sort((a, b) => {
                const aType = a.name || a.type || '';
                const bType = b.name || b.type || '';
                return aType.localeCompare(bType);
            });
        }
        
        return sorted;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        if (!this.container) return;

        // Filter buttons
        this.container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.filter = btn.dataset.filter;
                this.render();
            });
        });

        // Sort select
        const sortSelect = this.container.querySelector('#validation-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.render();
            });
        }

        // Jump to line buttons
        this.container.querySelectorAll('.jump-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lineIndex = parseInt(btn.dataset.lineIndex);
                if (this.onJumpToLineCallback) {
                    this.onJumpToLineCallback(lineIndex);
                }
            });
        });

        // Problem item click (also jumps to line)
        this.container.querySelectorAll('.problem-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking on jump button
                if (e.target.closest('.jump-btn')) return;
                
                const jumpBtn = item.querySelector('.jump-btn');
                if (jumpBtn) {
                    jumpBtn.click();
                }
            });
        });
    }

    /**
     * Clear all problems
     */
    clear() {
        this.problems = [];
        this.render();
    }

    /**
     * Get problem counts
     */
    getCounts() {
        return {
            total: this.problems.length,
            errors: this.problems.filter(p => p.severity === 'error').length,
            warnings: this.problems.filter(p => p.severity === 'warning').length,
            info: this.problems.filter(p => p.severity === 'info').length
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationPanel;
}

console.log('✅ ValidationPanel loaded');
