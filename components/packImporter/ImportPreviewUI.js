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
        
        // File and entry selection tracking
        this.selectedFiles = new Map(); // packName -> Set of file paths
        this.selectedEntries = new Map(); // packName -> Map of filePath -> Set of entry names
        this.expandedFiles = new Set(); // Set of expanded file paths
        
        // Error editor state
        this.errorEditorModal = null;
        this.editingEntry = null;
        
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
        
        // Initialize file and entry selections (all selected by default)
        this.initializeSelections();

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
        
        let html = '<div class="pack-import-folders-tree">';

        // Render each folder with files
        for (const folderName of folders) {
            const folder = pack.folders?.[folderName];
            const exists = folder?.exists && folder?.totalFiles > 0;
            
            if (!exists) continue; // Skip empty folders
            
            const icons = {
                'Mobs': '👾',
                'Skills': '✨',
                'Items': '💎',
                'DropTables': '📋',
                'RandomSpawns': '🎲'
            };

            html += `
                <div class="pack-import-folder-section">
                    <div class="pack-import-folder-header">
                        <span class="icon">${icons[folderName] || '📁'}</span>
                        <span class="name">${folderName}</span>
                        <span class="count">(${folder.totalFiles} files)</span>
                    </div>
                    <div class="pack-import-file-list">
                        ${this.renderFileList(pack, folderName, folder)}
                    </div>
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
     * Render file list for a folder
     */
    renderFileList(pack, folderName, folder) {
        let html = '';
        
        const parseData = this.parseResults.get(pack.name);
        if (!parseData) return html;
        
        const packFiles = this.selectedFiles.get(pack.name) || new Set();
        const packEntries = this.selectedEntries.get(pack.name) || new Map();
        
        // Get all files in this folder
        const files = parseData.files.filter(f => {
            const folderType = (f.folderType || '').toLowerCase();
            return folderType === folderName.toLowerCase();
        });
        
        files.forEach(file => {
            const isFileSelected = packFiles.has(file.relativePath);
            const isExpanded = this.expandedFiles.has(file.relativePath);
            const entryCount = file.entries?.length || 0;
            const selectedEntrySet = packEntries.get(file.relativePath) || new Set();
            const selectedCount = selectedEntrySet.size;
            
            const hasErrors = file.errors && file.errors.length > 0;
            const hasWarnings = file.warnings && file.warnings.length > 0;
            
            html += `
                <div class="pack-import-file-item ${isExpanded ? 'expanded' : ''}">
                    <div class="pack-import-file-row">
                        <input type="checkbox" 
                               class="file-checkbox" 
                               data-pack="${pack.name}" 
                               data-file="${file.relativePath}"
                               ${isFileSelected ? 'checked' : ''}
                               ${entryCount === 0 ? 'disabled' : ''}>
                        <button class="pack-import-file-expand" 
                                data-file="${file.relativePath}"
                                ${entryCount === 0 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-${isExpanded ? 'down' : 'right'}"></i>
                        </button>
                        <span class="pack-import-file-name">${file.name || file.relativePath}</span>
                        <span class="pack-import-file-badge">
                            ${entryCount > 0 ? `${selectedCount}/${entryCount}` : 'empty'}
                        </span>
                        ${hasErrors ? '<span class="pack-import-error-badge">✗</span>' : ''}
                        ${hasWarnings ? '<span class="pack-import-warning-badge">⚠</span>' : ''}
                    </div>
                    ${isExpanded && entryCount > 0 ? this.renderEntryList(pack, file, selectedEntrySet) : ''}
                </div>
            `;
        });
        
        return html;
    }
    
    /**
     * Render entry list for a file
     */
    renderEntryList(pack, file, selectedEntrySet) {
        let html = '<div class="pack-import-entry-list">';
        
        const validation = this.validationResults.get(pack.name);
        
        file.entries.forEach(entry => {
            const isSelected = selectedEntrySet.has(entry.name);
            
            // Find validation result for this entry
            let entryValidation = null;
            if (validation && validation.validationResults) {
                const fileValidation = validation.validationResults.find(
                    fv => fv.relativePath === file.relativePath
                );
                if (fileValidation) {
                    entryValidation = fileValidation.entries.find(e => e.name === entry.name);
                }
            }
            
            const criticalIssues = entryValidation?.issues?.filter(i => i.severity === 'critical') || [];
            const warnings = entryValidation?.issues?.filter(i => i.severity === 'warning') || [];
            
            html += `
                <div class="pack-import-entry-item ${criticalIssues.length > 0 ? 'has-error' : ''}">
                    <input type="checkbox" 
                           class="entry-checkbox" 
                           data-pack="${pack.name}" 
                           data-file="${file.relativePath}"
                           data-entry="${entry.name}"
                           ${isSelected ? 'checked' : ''}>
                    <span class="pack-import-entry-name">${entry.name}</span>
                    ${criticalIssues.length > 0 ? `
                        <button class="pack-import-entry-edit" 
                                data-pack="${pack.name}"
                                data-file="${file.relativePath}"
                                data-entry="${entry.name}"
                                title="Edit to fix errors">
                            <i class="fas fa-edit"></i>
                        </button>
                        <span class="pack-import-error-count" title="${criticalIssues[0].message}">
                            ${criticalIssues.length}✗
                        </span>
                    ` : ''}
                    ${warnings.length > 0 && criticalIssues.length === 0 ? `
                        <span class="pack-import-warning-count" title="${warnings[0].message}">
                            ${warnings.length}⚠
                        </span>
                    ` : ''}
                </div>
            `;
        });
        
        html += '</div>';
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
    
    /**
     * Initialize file and entry selections for all packs
     */
    initializeSelections() {
        this.selectedFiles.clear();
        this.selectedEntries.clear();
        
        if (!this.scanResults) return;
        
        this.scanResults.packs.forEach(pack => {
            const files = new Set();
            const entries = new Map();
            
            const parseData = this.parseResults.get(pack.name);
            if (parseData && parseData.files) {
                parseData.files.forEach(file => {
                    if (file.success && file.entries && file.entries.length > 0) {
                        files.add(file.relativePath);
                        
                        const entrySet = new Set();
                        file.entries.forEach(entry => {
                            if (entry.name) entrySet.add(entry.name);
                        });
                        entries.set(file.relativePath, entrySet);
                    }
                });
            }
            
            this.selectedFiles.set(pack.name, files);
            this.selectedEntries.set(pack.name, entries);
        });
    }
    
    /**
     * Toggle file selection
     */
    toggleFileSelection(packName, filePath) {
        const files = this.selectedFiles.get(packName);
        if (!files) return;
        
        if (files.has(filePath)) {
            files.delete(filePath);
            // Also deselect all entries in this file
            const entries = this.selectedEntries.get(packName);
            if (entries) {
                entries.delete(filePath);
            }
        } else {
            files.add(filePath);
            // Also select all entries in this file
            const parseData = this.parseResults.get(packName);
            const file = parseData?.files.find(f => f.relativePath === filePath);
            if (file && file.entries) {
                const entries = this.selectedEntries.get(packName) || new Map();
                const entrySet = new Set();
                file.entries.forEach(entry => {
                    if (entry.name) entrySet.add(entry.name);
                });
                entries.set(filePath, entrySet);
                this.selectedEntries.set(packName, entries);
            }
        }
        
        this.updateDetailsPanel();
    }
    
    /**
     * Toggle entry selection
     */
    toggleEntrySelection(packName, filePath, entryName) {
        const packEntries = this.selectedEntries.get(packName);
        if (!packEntries) return;
        
        let fileEntries = packEntries.get(filePath);
        if (!fileEntries) {
            fileEntries = new Set();
            packEntries.set(filePath, fileEntries);
        }
        
        if (fileEntries.has(entryName)) {
            fileEntries.delete(entryName);
            // If no entries selected, deselect file
            if (fileEntries.size === 0) {
                const files = this.selectedFiles.get(packName);
                if (files) files.delete(filePath);
            }
        } else {
            fileEntries.add(entryName);
            // Make sure file is selected
            const files = this.selectedFiles.get(packName);
            if (files) files.add(filePath);
        }
        
        this.updateDetailsPanel();
    }
    
    /**
     * Toggle file expansion
     */
    toggleFileExpansion(filePath) {
        if (this.expandedFiles.has(filePath)) {
            this.expandedFiles.delete(filePath);
        } else {
            this.expandedFiles.add(filePath);
        }
        this.updateDetailsPanel();
    }
    
    /**
     * Update details panel without full re-render
     */
    updateDetailsPanel() {
        const detailsContent = this.modal?.querySelector('#details-content');
        if (detailsContent) {
            detailsContent.innerHTML = this.renderDetailsPanel();
            this.attachDetailsPanelListeners();
        }
    }
    
    /**
     * Show error editor modal
     */
    showErrorEditor(packName, filePath, entryName, errorIssue) {
        const parseData = this.parseResults.get(packName);
        const file = parseData?.files.find(f => f.relativePath === filePath);
        const entry = file?.entries.find(e => e.name === entryName);
        
        if (!entry) return;
        
        this.editingEntry = {
            packName,
            filePath,
            entryName,
            entry,
            errorIssue
        };
        
        this.createErrorEditorModal();
    }
    
    /**
     * Create error editor modal
     */
    createErrorEditorModal() {
        if (!this.editingEntry) return;
        
        const { entry, errorIssue, entryName } = this.editingEntry;
        
        // Convert entry data to YAML
        const yamlContent = this.entryToYAML(entry);
        
        const modal = document.createElement('div');
        modal.className = 'pack-import-error-editor-overlay';
        modal.innerHTML = `
            <div class="pack-import-error-editor-modal">
                <div class="pack-import-error-editor-header">
                    <h3>Edit Entry: ${entryName}</h3>
                    <button class="pack-import-close-btn" id="close-error-editor">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="pack-import-error-editor-body">
                    <div class="pack-import-error-info">
                        <strong>Issue:</strong> ${errorIssue?.message || 'Unknown error'}
                        ${errorIssue?.suggestion ? `<br><strong>Suggestion:</strong> ${errorIssue.suggestion}` : ''}
                    </div>
                    <textarea id="error-editor-textarea" class="pack-import-error-editor-textarea">${yamlContent}</textarea>
                    <div class="pack-import-error-editor-status" id="editor-status"></div>
                </div>
                <div class="pack-import-error-editor-footer">
                    <button class="pack-import-btn pack-import-btn-secondary" id="cancel-error-edit">Cancel</button>
                    <button class="pack-import-btn pack-import-btn-primary" id="save-error-edit">Save & Re-validate</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.errorEditorModal = modal;
        
        // Attach listeners
        modal.querySelector('#close-error-editor')?.addEventListener('click', () => this.closeErrorEditor());
        modal.querySelector('#cancel-error-edit')?.addEventListener('click', () => this.closeErrorEditor());
        modal.querySelector('#save-error-edit')?.addEventListener('click', () => this.saveErrorEdit());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeErrorEditor();
        });
    }
    
    /**
     * Convert entry object to YAML string
     */
    entryToYAML(entry) {
        if (!entry.data) return '';
        
        const data = entry.data;
        let yaml = `${entry.name}:\n`;
        
        for (const [key, value] of Object.entries(data)) {
            yaml += this.valueToYAML(key, value, 1);
        }
        
        return yaml;
    }
    
    /**
     * Convert value to YAML format
     */
    valueToYAML(key, value, indent = 0) {
        const spaces = '  '.repeat(indent);
        
        if (value === null || value === undefined) {
            return `${spaces}${key}:\n`;
        } else if (Array.isArray(value)) {
            if (value.length === 0) return `${spaces}${key}: []\n`;
            let yaml = `${spaces}${key}:\n`;
            value.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                    yaml += `${spaces}- `;
                    const itemYaml = this.objectToYAML(item, indent + 1);
                    yaml += itemYaml.trim().substring((indent + 1) * 2) + '\n';
                } else {
                    yaml += `${spaces}- ${item}\n`;
                }
            });
            return yaml;
        } else if (typeof value === 'object') {
            let yaml = `${spaces}${key}:\n`;
            for (const [k, v] of Object.entries(value)) {
                yaml += this.valueToYAML(k, v, indent + 1);
            }
            return yaml;
        } else if (typeof value === 'string' && (value.includes(':') || value.includes('#'))) {
            return `${spaces}${key}: '${value}'\n`;
        } else {
            return `${spaces}${key}: ${value}\n`;
        }
    }
    
    /**
     * Convert object to YAML
     */
    objectToYAML(obj, indent = 0) {
        let yaml = '';
        for (const [key, value] of Object.entries(obj)) {
            yaml += this.valueToYAML(key, value, indent);
        }
        return yaml;
    }
    
    /**
     * Save error edit
     */
    async saveErrorEdit() {
        const textarea = this.errorEditorModal?.querySelector('#error-editor-textarea');
        const statusDiv = this.errorEditorModal?.querySelector('#editor-status');
        
        if (!textarea || !this.editingEntry) return;
        
        const yamlContent = textarea.value;
        
        try {
            // Parse YAML
            const parsed = jsyaml.load(yamlContent);
            
            if (!parsed || typeof parsed !== 'object') {
                throw new Error('Invalid YAML: must be an object');
            }
            
            // Update entry data
            const { packName, filePath, entry } = this.editingEntry;
            const entryName = Object.keys(parsed)[0];
            
            entry.data = parsed[entryName];
            entry.name = entryName;
            
            // Re-validate
            // TODO: Add validation logic here
            
            if (statusDiv) {
                statusDiv.innerHTML = '<span style="color: #27ae60;">✓ Saved successfully!</span>';
            }
            
            setTimeout(() => {
                this.closeErrorEditor();
                this.updateDetailsPanel();
            }, 500);
            
        } catch (error) {
            if (statusDiv) {
                statusDiv.innerHTML = `<span style="color: #e74c3c;">✗ Error: ${error.message}</span>`;
            }
        }
    }
    
    /**
     * Close error editor
     */
    closeErrorEditor() {
        if (this.errorEditorModal) {
            this.errorEditorModal.remove();
            this.errorEditorModal = null;
        }
        this.editingEntry = null;
    }
}

window.ImportPreviewUI = ImportPreviewUI;
