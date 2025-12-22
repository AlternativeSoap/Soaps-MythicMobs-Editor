/**
 * Duplicate Detector Tool
 * Detects duplicate and similar content in MythicMobs packs
 */
class DuplicateDetector {
    constructor(editor) {
        this.editor = editor;
        this.similarityThreshold = 0.90; // 90% similarity threshold
    }
    
    /**
     * Analyze pack for duplicates
     * @param {Object} pack - The pack to analyze
     */
    analyze(pack) {
        const duplicates = {
            exact: [],
            similar: [],
            caseConflicts: []
        };
        
        // Check each category
        this._checkCategory(pack.mobs, 'Mob', duplicates);
        this._checkCategory(pack.skills, 'Skill', duplicates);
        this._checkCategory(pack.items, 'Item', duplicates);
        this._checkCategory(pack.droptables, 'DropTable', duplicates);
        this._checkCategory(pack.randomspawns, 'RandomSpawn', duplicates);
        
        this.renderModal(duplicates);
    }
    
    /**
     * Check a category for duplicates
     */
    _checkCategory(category, type, duplicates) {
        if (!category) return;
        
        const entries = Object.entries(category);
        const nameMap = new Map();
        
        // Check for exact name duplicates (shouldn't happen, but check anyway)
        entries.forEach(([name, content]) => {
            if (nameMap.has(name)) {
                duplicates.exact.push({
                    type,
                    name,
                    instances: [nameMap.get(name), content]
                });
            } else {
                nameMap.set(name, content);
            }
        });
        
        // Check for case-insensitive conflicts
        const caseMap = new Map();
        entries.forEach(([name, content]) => {
            const lowerName = name.toLowerCase();
            if (caseMap.has(lowerName) && caseMap.get(lowerName) !== name) {
                duplicates.caseConflicts.push({
                    type,
                    names: [caseMap.get(lowerName), name]
                });
            } else {
                caseMap.set(lowerName, name);
            }
        });
        
        // Check for content similarity
        for (let i = 0; i < entries.length; i++) {
            for (let j = i + 1; j < entries.length; j++) {
                const [name1, content1] = entries[i];
                const [name2, content2] = entries[j];
                
                const similarity = this._calculateSimilarity(content1, content2);
                
                if (similarity >= this.similarityThreshold) {
                    duplicates.similar.push({
                        type,
                        name1,
                        name2,
                        similarity: (similarity * 100).toFixed(1)
                    });
                }
            }
        }
    }
    
    /**
     * Calculate similarity between two objects using Levenshtein distance
     */
    _calculateSimilarity(obj1, obj2) {
        // Convert objects to normalized JSON strings
        const str1 = this._normalizeContent(obj1);
        const str2 = this._normalizeContent(obj2);
        
        // Calculate Levenshtein distance
        const distance = this._levenshteinDistance(str1, str2);
        const maxLength = Math.max(str1.length, str2.length);
        
        // Convert distance to similarity ratio
        const similarity = 1 - (distance / maxLength);
        
        return similarity;
    }
    
    /**
     * Normalize content for comparison
     */
    _normalizeContent(obj) {
        // Convert to JSON and normalize whitespace
        const json = JSON.stringify(obj, null, 0);
        return json.replace(/\s+/g, ' ').trim();
    }
    
    /**
     * Calculate Levenshtein distance between two strings
     */
    _levenshteinDistance(str1, str2) {
        const matrix = [];
        
        // Initialize matrix
        for (let i = 0; i <= str1.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str2.length; j++) {
            matrix[0][j] = j;
        }
        
        // Fill matrix
        for (let i = 1; i <= str1.length; i++) {
            for (let j = 1; j <= str2.length; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }
        
        return matrix[str1.length][str2.length];
    }
    
    /**
     * Render duplicates modal
     */
    renderModal(duplicates) {
        const totalIssues = duplicates.exact.length + duplicates.similar.length + duplicates.caseConflicts.length;
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'duplicate-detector-modal';
        
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>
                        <i class="fas fa-clone"></i>
                        Duplicate Detector
                    </h2>
                    <button class="btn-close" onclick="document.getElementById('duplicate-detector-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    ${totalIssues === 0 ? `
                        <div class="duplicates-clean">
                            <i class="fas fa-check-circle"></i>
                            <h3>No Duplicates Found!</h3>
                            <p>Your pack is clean. No duplicate or similar content detected.</p>
                        </div>
                    ` : `
                        <!-- Summary -->
                        <div class="duplicates-summary">
                            <div class="summary-item ${duplicates.exact.length > 0 ? 'error' : ''}">
                                <i class="fas fa-copy"></i>
                                <div>
                                    <strong>${duplicates.exact.length}</strong>
                                    <span>Exact Duplicates</span>
                                </div>
                            </div>
                            <div class="summary-item ${duplicates.similar.length > 0 ? 'warning' : ''}">
                                <i class="fas fa-clone"></i>
                                <div>
                                    <strong>${duplicates.similar.length}</strong>
                                    <span>Similar Content (≥${(this.similarityThreshold * 100).toFixed(0)}%)</span>
                                </div>
                            </div>
                            <div class="summary-item ${duplicates.caseConflicts.length > 0 ? 'warning' : ''}">
                                <i class="fas fa-font"></i>
                                <div>
                                    <strong>${duplicates.caseConflicts.length}</strong>
                                    <span>Case Conflicts</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Tabs -->
                        <div class="duplicates-tabs">
                            <button class="duplicates-tab active" data-tab="exact" ${duplicates.exact.length === 0 ? 'disabled' : ''}>
                                Exact (${duplicates.exact.length})
                            </button>
                            <button class="duplicates-tab" data-tab="similar" ${duplicates.similar.length === 0 ? 'disabled' : ''}>
                                Similar (${duplicates.similar.length})
                            </button>
                            <button class="duplicates-tab" data-tab="case" ${duplicates.caseConflicts.length === 0 ? 'disabled' : ''}>
                                Case Conflicts (${duplicates.caseConflicts.length})
                            </button>
                        </div>
                        
                        <!-- Tab Content -->
                        <div class="duplicates-content">
                            <!-- Exact Duplicates -->
                            <div class="duplicates-tab-panel active" data-panel="exact">
                                ${duplicates.exact.length === 0 ? `
                                    <div class="empty-state">
                                        <i class="fas fa-check"></i>
                                        <p>No exact duplicates found</p>
                                    </div>
                                ` : `
                                    ${duplicates.exact.map((dup, index) => `
                                        <div class="duplicate-item exact">
                                            <div class="duplicate-header">
                                                <div class="duplicate-icon">
                                                    <i class="fas fa-copy"></i>
                                                </div>
                                                <div class="duplicate-info">
                                                    <strong>${dup.type}: ${dup.name}</strong>
                                                    <span>Exact duplicate detected</span>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                `}
                            </div>
                            
                            <!-- Similar Content -->
                            <div class="duplicates-tab-panel" data-panel="similar">
                                ${duplicates.similar.length === 0 ? `
                                    <div class="empty-state">
                                        <i class="fas fa-check"></i>
                                        <p>No similar content found</p>
                                    </div>
                                ` : `
                                    ${duplicates.similar.map((dup, index) => `
                                        <div class="duplicate-item similar">
                                            <div class="duplicate-header">
                                                <div class="duplicate-icon">
                                                    <i class="fas fa-clone"></i>
                                                </div>
                                                <div class="duplicate-info">
                                                    <strong>${dup.type}: ${dup.name1} ↔ ${dup.name2}</strong>
                                                    <span>${dup.similarity}% similar</span>
                                                </div>
                                                <div class="similarity-badge">${dup.similarity}%</div>
                                            </div>
                                        </div>
                                    `).join('')}
                                `}
                            </div>
                            
                            <!-- Case Conflicts -->
                            <div class="duplicates-tab-panel" data-panel="case">
                                ${duplicates.caseConflicts.length === 0 ? `
                                    <div class="empty-state">
                                        <i class="fas fa-check"></i>
                                        <p>No case conflicts found</p>
                                    </div>
                                ` : `
                                    ${duplicates.caseConflicts.map((dup, index) => `
                                        <div class="duplicate-item case">
                                            <div class="duplicate-header">
                                                <div class="duplicate-icon">
                                                    <i class="fas fa-font"></i>
                                                </div>
                                                <div class="duplicate-info">
                                                    <strong>${dup.type}: ${dup.names.join(' vs ')}</strong>
                                                    <span>Names differ only in capitalization</span>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                `}
                            </div>
                        </div>
                    `}
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('duplicate-detector-modal').remove()">
                        Close
                    </button>
                    ${totalIssues > 0 ? `
                        <button class="btn btn-primary" onclick="window.duplicateDetectorInstance.exportReport()">
                            <i class="fas fa-download"></i> Export Report
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Store instance for export
        window.duplicateDetectorInstance = this;
        this._currentDuplicates = duplicates;
        
        // Setup tab switching
        this._setupTabs(modal);
    }
    
    /**
     * Setup tab switching
     */
    _setupTabs(modal) {
        const tabs = modal.querySelectorAll('.duplicates-tab');
        const panels = modal.querySelectorAll('.duplicates-tab-panel');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                if (tab.disabled) return;
                
                // Remove active from all
                tabs.forEach(t => t.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));
                
                // Add active to clicked
                tab.classList.add('active');
                const targetPanel = modal.querySelector(`.duplicates-tab-panel[data-panel="${tab.dataset.tab}"]`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
            });
        });
    }
    
    /**
     * Export duplicates report
     */
    exportReport() {
        const report = {
            timestamp: new Date().toISOString(),
            threshold: this.similarityThreshold,
            duplicates: this._currentDuplicates
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `duplicate_report_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.editor.showToast('Duplicate report exported', 'success');
    }
}
