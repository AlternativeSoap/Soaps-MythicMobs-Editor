/**
 * ImportPreviewUI.js - Part 1
 * Main modal structure and rendering
 */
class ImportPreviewUI {
    constructor() {
        this.modal = null;
        this.scanResults = null;
        this.parseResults = new Map();
        this.validationResults = new Map();
        this.selectedPacks = new Set();
        this.currentPack = null;
        this.issueFilter = 'all';
        this.importOptions = {
            missingReferences: 'placeholder',
            onParseErrors: 'skip',
            onWarnings: true,
            duplicates: 'skip'
        };
        
        // Callbacks (set by PackImporterCore)
        this.onImport = null;
        this.onExportReport = null;
    }

    /**
     * Show the modal (initially with loading state)
     */
    show() {
        this.createLoadingModal();
    }

    /**
     * Create the loading modal
     */
    createLoadingModal() {
        // Remove existing modal if any
        this.close();

        const modal = document.createElement('div');
        modal.id = 'import-preview-modal';
        modal.className = 'pack-import-modal-overlay';
        modal.innerHTML = `
            <div class="pack-import-modal">
                <div class="pack-import-header">
                    <h2>Import MythicMobs Packs</h2>
                    <button class="pack-import-close-btn" id="close-import-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="pack-import-loading" id="loading-container">
                    <div class="pack-import-loading-spinner"></div>
                    <div class="pack-import-loading-text" id="loading-text">Initializing...</div>
                    <div class="pack-import-loading-progress">
                        <div class="pack-import-loading-progress-bar" id="loading-progress" style="width: 0%"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;

        // Attach close handler
        modal.querySelector('#close-import-modal')?.addEventListener('click', () => this.close());
        modal.querySelector('.pack-import-modal-overlay')?.addEventListener('click', (e) => {
            if (e.target === modal) this.close();
        });
    }

    /**
     * Show loading state
     */
    showLoading(message = 'Loading...') {
        const loadingText = this.modal?.querySelector('#loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        }
    }

    /**
     * Update loading progress
     */
    updateLoadingStatus(message, progress) {
        const loadingText = this.modal?.querySelector('#loading-text');
        const progressBar = this.modal?.querySelector('#loading-progress');
        
        if (loadingText) {
            loadingText.textContent = message;
        }
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const loadingContainer = this.modal?.querySelector('#loading-container');
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }
    }

    /**
     * Show error state
     */
    showError(message) {
        // Create modal if it doesn't exist (was closed during import)
        if (!this.modal) {
            this.modal = document.createElement('div');
            this.modal.id = 'import-preview-modal';
            this.modal.className = 'pack-import-overlay';
            this.modal.innerHTML = `
                <div class="pack-import-modal">
                    <div id="loading-container"></div>
                </div>
            `;
            document.body.appendChild(this.modal);
        }
        
        const loadingContainer = this.modal?.querySelector('#loading-container');
        const modalContent = this.modal?.querySelector('.pack-import-modal');
        
        const errorHtml = `
            <div class="pack-import-error" style="padding: 40px; text-align: center;">
                <div class="pack-import-error-icon" style="font-size: 48px; margin-bottom: 16px;">❌</div>
                <div class="pack-import-error-message" style="margin-bottom: 24px; color: #e74c3c;">${message}</div>
                <button class="pack-import-btn pack-import-btn-secondary" onclick="window.packImporter?.previewUI?.close()">
                    Close
                </button>
            </div>
        `;
        
        if (loadingContainer) {
            loadingContainer.innerHTML = errorHtml;
        } else if (modalContent) {
            modalContent.innerHTML = errorHtml;
        }
    }

    /**
     * Render the full preview with data
     */
    render(scanResults, parseResults, validationResults) {
        this.scanResults = scanResults;
        this.parseResults = parseResults;
        this.validationResults = validationResults;

        // Select all packs by default
        this.selectedPacks.clear();
        scanResults.packs.forEach(pack => {
            this.selectedPacks.add(pack.name);
        });

        // Set first pack as current
        if (scanResults.packs.length > 0) {
            this.currentPack = scanResults.packs[0];
        }

        // Replace modal content with full preview
        if (this.modal) {
            this.modal.innerHTML = this.renderModalContent();
            this.attachEventListeners();
        }
    }

    /**
     * Hide the modal
     */
    hide() {
        this.close();
    }

    /**
     * Render the complete modal content
     */
    renderModalContent() {
        return `
            <div class="pack-import-modal">
                <div class="pack-import-header">
                    <h2>Import MythicMobs Packs</h2>
                    <div class="pack-import-header-actions">
                        <button class="pack-import-close-btn" id="close-import-modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <div class="pack-import-content">
                    <!-- Left Panel: Pack List -->
                    <div class="pack-import-packs-panel">
                        <div class="pack-import-panel-header">
                            <h3>Packs</h3>
                            <label class="pack-import-select-all">
                                <input type="checkbox" id="select-all-checkbox" checked>
                                <span>Select All</span>
                            </label>
                        </div>
                        <div class="pack-import-pack-list" id="pack-list">
                            ${this.renderPackList()}
                        </div>
                    </div>

                    <!-- Center Panel: Details -->
                    <div class="pack-import-details-panel">
                        <div class="pack-import-panel-header">
                            <h3>Details</h3>
                        </div>
                        <div class="pack-import-details-content" id="details-content">
                            ${this.renderDetailsPanel()}
                        </div>
                    </div>

                    <!-- Right Panel: Issues -->
                    <div class="pack-import-issues-panel">
                        <div class="pack-import-panel-header">
                            <h3>Issues</h3>
                        </div>
                        <div class="pack-import-issues-filters">
                            <button class="pack-import-filter-btn ${this.issueFilter === 'all' ? 'active' : ''}" data-filter="all">
                                All <span class="count">${this.getIssueCount('all')}</span>
                            </button>
                            <button class="pack-import-filter-btn ${this.issueFilter === 'critical' ? 'active' : ''}" data-filter="critical">
                                Critical <span class="count">${this.getIssueCount('critical')}</span>
                            </button>
                            <button class="pack-import-filter-btn ${this.issueFilter === 'warning' ? 'active' : ''}" data-filter="warning">
                                Warnings <span class="count">${this.getIssueCount('warning')}</span>
                            </button>
                        </div>
                        <div class="pack-import-issues-list" id="issues-list">
                            ${this.renderIssuesList()}
                        </div>
                    </div>
                </div>

                <!-- Summary Bar -->
                <div class="pack-import-summary-bar">
                    ${this.renderSummaryBar()}
                </div>
            </div>
        `;
    }

    /**
     * Get issue count by severity
     */
    getIssueCount(severity) {
        if (!this.currentPack) return 0;
        
        const validation = this.validationResults.get(this.currentPack.name);
        const parseData = this.parseResults.get(this.currentPack.name);
        
        if (!validation && !parseData) return 0;
        
        let count = 0;
        
        // Count parse errors
        if (parseData) {
            for (const file of parseData.files) {
                if (severity === 'all' || severity === 'critical') {
                    count += file.errors?.length || 0;
                }
                if (severity === 'all' || severity === 'warning') {
                    count += file.warnings?.length || 0;
                }
            }
        }
        
        // Count validation issues
        if (validation) {
            for (const fileResult of validation.validationResults || []) {
                for (const entry of fileResult.entries || []) {
                    for (const issue of entry.issues || []) {
                        if (severity === 'all' || issue.severity === severity) {
                            count++;
                        }
                    }
                }
            }
        }
        
        return count;
    }

    /**
     * Render the pack list
     */
    renderPackList() {
        if (!this.scanResults || this.scanResults.packs.length === 0) {
            return '<div class="pack-import-empty-state">No packs found</div>';
        }

        return this.scanResults.packs.map(pack => {
            const validation = this.validationResults.get(pack.name);
            const status = this.getPackStatus(pack, validation);
            const isSelected = this.selectedPacks.has(pack.name);
            const isActive = this.currentPack && this.currentPack.name === pack.name;
            
            // Safely access stats with fallbacks
            const totalFiles = pack.stats?.totalFiles || 0;

            // Count issues for badges
            const criticalCount = this.getPackIssueCount(pack.name, 'critical');
            const warningCount = this.getPackIssueCount(pack.name, 'warning');

            return `
                <div class="pack-import-pack-item ${isActive ? 'selected' : ''}" data-pack="${pack.name}">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} data-pack-select="${pack.name}">
                    <div class="pack-import-pack-info">
                        <div class="pack-import-pack-name">${pack.name}</div>
                        <div class="pack-import-pack-stats">
                            <span class="pack-import-pack-stat">📁 ${totalFiles} files</span>
                        </div>
                    </div>
                    <div class="pack-import-pack-issues">
                        ${criticalCount > 0 ? `<span class="pack-import-issue-badge critical">${criticalCount}</span>` : ''}
                        ${warningCount > 0 ? `<span class="pack-import-issue-badge warning">${warningCount}</span>` : ''}
                        ${criticalCount === 0 && warningCount === 0 ? '<span class="pack-import-issue-badge info">✓</span>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Get issue count for a specific pack
     */
    getPackIssueCount(packName, severity) {
        const validation = this.validationResults.get(packName);
        const parseData = this.parseResults.get(packName);
        
        let count = 0;
        
        if (parseData) {
            for (const file of parseData.files || []) {
                if (severity === 'critical') count += file.errors?.length || 0;
                if (severity === 'warning') count += file.warnings?.length || 0;
            }
        }
        
        if (validation) {
            for (const fileResult of validation.validationResults || []) {
                for (const entry of fileResult.entries || []) {
                    for (const issue of entry.issues || []) {
                        if (issue.severity === severity) count++;
                    }
                }
            }
        }
        
        return count;
    }

    /**
     * Get pack status based on validation
     */
    getPackStatus(pack, validation) {
        if (!validation || !validation.summary) {
            return { type: 'unknown', icon: 'fa-question-circle', message: '' };
        }

        const criticalErrors = validation.summary.criticalErrors || 0;
        const warnings = validation.summary.warnings || 0;

        if (criticalErrors > 0) {
            return { 
                type: 'error', 
                icon: 'fa-times-circle', 
                message: `${criticalErrors} error${criticalErrors > 1 ? 's' : ''}` 
            };
        } else if (warnings > 0) {
            return { 
                type: 'warning', 
                icon: 'fa-exclamation-circle', 
                message: `${warnings} warning${warnings > 1 ? 's' : ''}` 
            };
        } else {
            return { type: 'success', icon: 'fa-check-circle', message: '' };
        }
    }

    /**
     * Render the details panel for current pack
     */
    renderDetailsPanel() {
        if (!this.currentPack) {
            return `
                <div class="pack-import-empty-state">
                    <div class="icon">📦</div>
                    <h4>Select a pack to view details</h4>
                </div>
            `;
        }

        const pack = this.currentPack;
        const validation = this.validationResults.get(pack.name);

        return `
            <div class="pack-import-detail-card">
                <h4>📁 Folder Structure</h4>
                ${this.renderFolderTree(pack)}
            </div>

            <div class="pack-import-detail-card">
                <h4>📊 Statistics</h4>
                ${this.renderFileStats(pack, validation)}
            </div>
        `;
    }

    /**
     * Render folder tree
     */
    renderFolderTree(pack) {
        const folders = ['Mobs', 'Skills', 'Items', 'DropTables', 'RandomSpawns'];
        
        let html = '<div class="pack-import-folders-grid">';

        // Folders
        for (const folderName of folders) {
            const folder = pack.folders?.[folderName];
            const exists = folder?.exists && folder?.totalFiles > 0;
            const fileCount = folder?.totalFiles || 0;
            
            const icons = {
                'Mobs': '👾',
                'Skills': '✨',
                'Items': '💎',
                'DropTables': '📋',
                'RandomSpawns': '🎲'
            };

            html += `
                <div class="pack-import-folder-item ${exists ? '' : 'empty'}">
                    <div class="icon">${icons[folderName] || '📁'}</div>
                    <div class="name">${folderName}</div>
                    <div class="count">${fileCount} files</div>
                </div>
            `;
        }

        html += '</div>';

        // Unknown folders
        const unknownFolders = pack.unknownFolders || [];
        if (unknownFolders.length > 0) {
            html += `
                <div class="pack-import-unknown-folders">
                    <h5>⚠️ Unknown Folders (will be skipped)</h5>
                    <div class="pack-import-unknown-list">
                        ${unknownFolders.map(f => `<span class="pack-import-unknown-tag">${f}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        return html;
    }

    /**
     * Render folder contents
     */
    renderFolderContents(folder, folderName) {
        let html = '';

        // Direct files
        for (const file of folder.files || []) {
            const parseResult = this.getFileParseResult(this.currentPack.name, `${folderName}/${file.name}`);
            const status = parseResult ? (parseResult.success ? 'success' : 'error') : 'unknown';
            const entryCount = parseResult?.entries?.length ?? parseResult?.entryCount ?? '?';
            
            html += `
                <li class="tree-item file" data-file="${folderName}/${file.name}">
                    <span class="tree-icon"><i class="fas fa-file"></i></span>
                    <span class="tree-name">${file.name}</span>
                    <span class="tree-badge ${status}">${entryCount}</span>
                </li>
            `;
        }

        // Subfolders
        for (const subfolder of folder.subfolders || []) {
            html += `
                <li class="tree-item folder expandable" data-subfolder="${folderName}/${subfolder.name}">
                    <span class="tree-expand"><i class="fas fa-chevron-right"></i></span>
                    <span class="tree-icon"><i class="fas fa-folder"></i></span>
                    <span class="tree-name">${subfolder.name}</span>
                    <span class="tree-badge">${subfolder.totalFiles || 0}</span>
                </li>
                <ul class="tree-children collapsed">
                    ${this.renderSubfolderContents(subfolder, `${folderName}/${subfolder.name}`)}
                </ul>
            `;
        }

        return html;
    }

    /**
     * Render subfolder contents recursively
     */
    renderSubfolderContents(folder, basePath) {
        let html = '';

        for (const file of folder.files || []) {
            const parseResult = this.getFileParseResult(this.currentPack.name, `${basePath}/${file.name}`);
            const status = parseResult ? (parseResult.success ? 'success' : 'error') : 'unknown';
            const entryCount = parseResult?.entries?.length ?? parseResult?.entryCount ?? '?';
            
            html += `
                <li class="tree-item file">
                    <span class="tree-icon"><i class="fas fa-file"></i></span>
                    <span class="tree-name">${file.name}</span>
                    <span class="tree-badge ${status}">${entryCount}</span>
                </li>
            `;
        }

        for (const subfolder of folder.subfolders || []) {
            html += `
                <li class="tree-item folder expandable">
                    <span class="tree-expand"><i class="fas fa-chevron-right"></i></span>
                    <span class="tree-icon"><i class="fas fa-folder"></i></span>
                    <span class="tree-name">${subfolder.name}</span>
                    <span class="tree-badge">${subfolder.totalFiles || 0}</span>
                </li>
                <ul class="tree-children collapsed">
                    ${this.renderSubfolderContents(subfolder, `${basePath}/${subfolder.name}`)}
                </ul>
            `;
        }

        return html;
    }

    /**
     * Get file parse result
     */
    getFileParseResult(packName, relativePath) {
        const parseData = this.parseResults.get(packName);
        if (!parseData) return null;
        
        return parseData.files.find(f => f.relativePath === relativePath);
    }

    /**
     * Render pack info preview
     */
    renderPackInfo(pack) {
        const parseData = this.parseResults.get(pack.name);
        if (!parseData) return '';

        const packinfoFile = parseData.files.find(f => f.relativePath === 'packinfo.yml');
        if (!packinfoFile || !packinfoFile.success || packinfoFile.entries.length === 0) return '';

        const info = packinfoFile.entries[0]?.data || {};

        return `
            <div class="pack-info-preview">
                <h5><i class="fas fa-info-circle"></i> Pack Info</h5>
                <div class="info-grid">
                    ${info.Name ? `<div class="info-item"><label>Name:</label><span>${info.Name}</span></div>` : ''}
                    ${info.Version ? `<div class="info-item"><label>Version:</label><span>${info.Version}</span></div>` : ''}
                    ${info.Author ? `<div class="info-item"><label>Author:</label><span>${info.Author}</span></div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render file statistics
     */
    renderFileStats(pack, validation) {
        const stats = pack.stats?.filesByType || {};
        const validationSummary = validation?.summary || {};

        return `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Mobs</div>
                    <div class="stat-value">${stats.mobs || 0}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Skills</div>
                    <div class="stat-value">${stats.skills || 0}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Items</div>
                    <div class="stat-value">${stats.items || 0}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">DropTables</div>
                    <div class="stat-value">${stats.droptables || 0}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">RandomSpawns</div>
                    <div class="stat-value">${stats.randomspawns || 0}</div>
                </div>
            </div>
            <div class="validation-stats">
                <div class="vstat-item success">
                    <i class="fas fa-check-circle"></i>
                    <span>${validationSummary.validEntries || 0} valid</span>
                </div>
                <div class="vstat-item warning">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>${validationSummary.warnings || 0} warnings</span>
                </div>
                <div class="vstat-item error">
                    <i class="fas fa-times-circle"></i>
                    <span>${validationSummary.criticalErrors || 0} errors</span>
                </div>
            </div>
        `;
    }
}

window.ImportPreviewUI = ImportPreviewUI;
