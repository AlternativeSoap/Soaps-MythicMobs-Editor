/**
 * ImportPreviewUI.js - Part 2
 * Issues rendering and event handling
 */

Object.assign(ImportPreviewUI.prototype, {

    /**
     * Render issues list
     */
    renderIssuesList() {
        if (!this.currentPack) {
            return `<div class="pack-import-empty-state">
                <div class="icon">📋</div>
                <span>Select a pack to view issues</span>
            </div>`;
        }

        const validation = this.validationResults.get(this.currentPack.name);
        const parseData = this.parseResults.get(this.currentPack.name);
        
        const issues = this.collectIssues(parseData, validation);
        const filteredIssues = this.filterIssues(issues);

        if (filteredIssues.length === 0) {
            return `
                <div class="pack-import-empty-state">
                    <div class="icon">✅</div>
                    <h4>No issues found!</h4>
                </div>
            `;
        }

        return filteredIssues.map(issue => this.renderIssueCard(issue)).join('');
    },

    /**
     * Collect all issues from parse and validation results
     */
    collectIssues(parseData, validation) {
        const issues = [];

        // Parse errors
        if (parseData) {
            for (const file of parseData.files) {
                for (const error of file.errors) {
                    issues.push({
                        ...error,
                        file: file.file,
                        relativePath: file.relativePath,
                        source: 'parse',
                        rawContent: file.rawContent
                    });
                }
                for (const warning of file.warnings) {
                    issues.push({
                        ...warning,
                        file: file.file,
                        relativePath: file.relativePath,
                        source: 'parse',
                        rawContent: file.rawContent
                    });
                }
            }
        }

        // Validation issues
        if (validation) {
            for (const fileResult of validation.validationResults) {
                for (const entry of fileResult.entries) {
                    for (const issue of entry.issues) {
                        issues.push({
                            ...issue,
                            file: fileResult.file,
                            relativePath: fileResult.relativePath,
                            entry: entry.name,
                            lineStart: entry.lineStart,
                            source: 'validation'
                        });
                    }
                }
            }
        }

        // Sort by severity
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        issues.sort((a, b) => {
            const orderA = severityOrder[a.severity] ?? 3;
            const orderB = severityOrder[b.severity] ?? 3;
            return orderA - orderB;
        });

        return issues;
    },

    /**
     * Filter issues based on current filter
     */
    filterIssues(issues) {
        if (this.issueFilter === 'all') return issues;
        return issues.filter(i => i.severity === this.issueFilter);
    },

    /**
     * Render a single issue card
     */
    renderIssueCard(issue) {
        const severityLabels = {
            critical: 'CRITICAL',
            warning: 'WARNING',
            info: 'INFO'
        };

        // Get file name for display
        const fileName = issue.relativePath || issue.file || '';
        const displayPath = fileName ? fileName.replace(/\\/g, '/').split('/').slice(-2).join('/') : '';
        
        // Build location string
        const locationParts = [];
        if (displayPath) locationParts.push(displayPath);
        if (issue.entry) locationParts.push(issue.entry);
        if (issue.lineStart) locationParts.push(`Line ${issue.lineStart}`);
        else if (issue.line) locationParts.push(`Line ${issue.line}`);
        const locationStr = locationParts.join(' › ');

        return `
            <div class="pack-import-issue-item ${issue.severity || 'info'}">
                <div class="pack-import-issue-header">
                    <span class="pack-import-issue-type">${severityLabels[issue.severity] || 'INFO'}: ${issue.type || 'Issue'}</span>
                </div>
                ${locationStr ? `
                    <div class="pack-import-issue-location" style="font-size: 0.85em; color: #888; margin-bottom: 4px;">
                        <i class="fas fa-file-alt" style="margin-right: 4px;"></i>${this.escapeHtml(locationStr)}
                    </div>
                ` : ''}
                <div class="pack-import-issue-message">${issue.message}</div>
                ${issue.suggestion ? `
                    <div class="pack-import-issue-suggestion">${issue.suggestion}</div>
                ` : ''}
                ${issue.snippet ? this.renderCodeSnippet(issue.snippet) : ''}
            </div>
        `;
    },

    /**
     * Render code snippet
     */
    renderCodeSnippet(snippet) {
        if (!snippet) return '';

        let html = '<div class="pack-import-code-snippet">';
        
        // Before lines
        if (snippet.before) {
            for (const line of snippet.before) {
                const lineNum = typeof line === 'object' ? line.num : '';
                const lineText = typeof line === 'object' ? line.text : line;
                html += `<div class="pack-import-code-line"><span class="pack-import-code-line-number">${lineNum}</span><span class="pack-import-code-line-content">${this.escapeHtml(lineText)}</span></div>`;
            }
        }

        // Error line
        if (snippet.errorLine) {
            const lineNum = typeof snippet.errorLine === 'object' ? snippet.errorLine.num : '';
            const lineText = typeof snippet.errorLine === 'object' ? snippet.errorLine.text : snippet.errorLine;
            html += `<div class="pack-import-code-line highlight"><span class="pack-import-code-line-number">${lineNum}</span><span class="pack-import-code-line-content">${this.escapeHtml(lineText)}</span></div>`;
        }

        // After lines
        if (snippet.after) {
            for (const line of snippet.after) {
                const lineNum = typeof line === 'object' ? line.num : '';
                const lineText = typeof line === 'object' ? line.text : line;
                html += `<div class="pack-import-code-line"><span class="pack-import-code-line-number">${lineNum}</span><span class="pack-import-code-line-content">${this.escapeHtml(lineText)}</span></div>`;
            }
        }

        html += '</div>';
        return html;
    },

    /**
     * Render summary bar
     */
    renderSummaryBar() {
        const totals = this.calculateTotals();

        return `
            <div class="pack-import-summary-stats">
                <div class="pack-import-summary-stat">
                    <span class="icon">📦</span>
                    <span class="label">Selected:</span>
                    <span class="value">${this.selectedPacks.size}/${this.scanResults?.packs?.length || 0}</span>
                </div>
                <div class="pack-import-summary-stat">
                    <span class="icon">👾</span>
                    <span class="label">Mobs:</span>
                    <span class="value">${totals.mobs.ready}</span>
                </div>
                <div class="pack-import-summary-stat">
                    <span class="icon">✨</span>
                    <span class="label">Skills:</span>
                    <span class="value">${totals.skills.ready}</span>
                </div>
                <div class="pack-import-summary-stat">
                    <span class="icon">💎</span>
                    <span class="label">Items:</span>
                    <span class="value">${totals.items.ready}</span>
                </div>
            </div>

            <div class="pack-import-summary-actions">
                <button class="pack-import-btn pack-import-btn-secondary" id="cancel-import">
                    Cancel
                </button>
                <button class="pack-import-btn pack-import-btn-primary" id="start-import" ${this.selectedPacks.size === 0 ? 'disabled' : ''}>
                    Import Selected (${this.selectedPacks.size})
                </button>
            </div>
        `;
    },

    /**
     * Calculate totals for summary
     */
    calculateTotals() {
        const totals = {
            mobs: { ready: 0, warnings: 0, errors: 0 },
            skills: { ready: 0, warnings: 0, errors: 0 },
            items: { ready: 0, warnings: 0, errors: 0 },
            droptables: { ready: 0, warnings: 0, errors: 0 },
            randomspawns: { ready: 0, warnings: 0, errors: 0 }
        };

        for (const packName of this.selectedPacks) {
            const validation = this.validationResults.get(packName);
            if (!validation) continue;

            for (const fileResult of validation.validationResults) {
                const folderType = fileResult.folderType?.toLowerCase().replace('s', '') || '';
                if (!totals[folderType] && !totals[folderType + 's']) continue;

                const target = totals[folderType] || totals[folderType + 's'];
                if (!target) continue;

                for (const entry of fileResult.entries) {
                    const hasCritical = entry.issues.some(i => i.severity === 'critical');
                    const hasWarning = entry.issues.some(i => i.severity === 'warning');

                    if (hasCritical) {
                        target.errors++;
                    } else if (hasWarning) {
                        target.warnings++;
                    } else {
                        target.ready++;
                    }
                }
            }
        }

        return totals;
    },

    /**
     * Calculate cross-references summary
     */
    calculateCrossReferences() {
        let resolved = 0;
        let missing = 0;

        for (const packName of this.selectedPacks) {
            const validation = this.validationResults.get(packName);
            if (!validation || !validation.crossReferences) continue;

            const refs = validation.crossReferences;
            resolved += (refs.resolvedReferences.skills?.length || 0);
            resolved += (refs.resolvedReferences.items?.length || 0);
            resolved += (refs.resolvedReferences.mobs?.length || 0);
            resolved += (refs.resolvedReferences.droptables?.length || 0);

            missing += (refs.missingReferences.skills?.length || 0);
            missing += (refs.missingReferences.items?.length || 0);
            missing += (refs.missingReferences.mobs?.length || 0);
            missing += (refs.missingReferences.droptables?.length || 0);
        }

        return { resolved, missing };
    },

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close button
        this.modal.querySelector('#close-import-modal')?.addEventListener('click', () => this.close());
        this.modal.querySelector('#cancel-import')?.addEventListener('click', () => this.close());

        // Pack selection checkboxes
        this.modal.querySelectorAll('[data-pack-select]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const packName = e.target.dataset.packSelect;
                if (e.target.checked) {
                    this.selectedPacks.add(packName);
                } else {
                    this.selectedPacks.delete(packName);
                }
                this.updateUI();
            });
        });

        // Pack item click (to select/view)
        this.modal.querySelectorAll('.pack-import-pack-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('input[type="checkbox"]')) return;
                const packName = item.dataset.pack;
                this.currentPack = this.scanResults.packs.find(p => p.name === packName);
                this.updateUI();
            });
        });

        // Select all checkbox
        this.modal.querySelector('#select-all-checkbox')?.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.scanResults.packs.forEach(pack => this.selectedPacks.add(pack.name));
            } else {
                this.selectedPacks.clear();
            }
            this.updateUI();
        });

        // Issue filter buttons
        this.modal.querySelectorAll('.pack-import-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.issueFilter = btn.dataset.filter;
                this.updateUI();
            });
        });

        // Import button
        this.modal.querySelector('#start-import')?.addEventListener('click', () => {
            this.startImport();
        });
        
        // Attach details panel listeners
        this.attachDetailsPanelListeners();
    },
    
    /**
     * Attach event listeners for details panel (files, entries, etc.)
     */
    attachDetailsPanelListeners() {
        // File checkboxes
        this.modal.querySelectorAll('.file-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const packName = e.target.dataset.pack;
                const filePath = e.target.dataset.file;
                this.toggleFileSelection(packName, filePath);
            });
        });
        
        // Entry checkboxes
        this.modal.querySelectorAll('.entry-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const packName = e.target.dataset.pack;
                const filePath = e.target.dataset.file;
                const entryName = e.target.dataset.entry;
                this.toggleEntrySelection(packName, filePath, entryName);
            });
        });
        
        // File expand buttons
        this.modal.querySelectorAll('.pack-import-file-expand').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const filePath = btn.dataset.file;
                this.toggleFileExpansion(filePath);
            });
        });
        
        // Entry edit buttons
        this.modal.querySelectorAll('.pack-import-entry-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const packName = btn.dataset.pack;
                const filePath = btn.dataset.file;
                const entryName = btn.dataset.entry;
                
                // Find the error issue
                const validation = this.validationResults.get(packName);
                let errorIssue = null;
                
                if (validation && validation.validationResults) {
                    const fileValidation = validation.validationResults.find(
                        fv => fv.relativePath === filePath
                    );
                    if (fileValidation) {
                        const entryValidation = fileValidation.entries.find(e => e.name === entryName);
                        if (entryValidation && entryValidation.issues) {
                            errorIssue = entryValidation.issues.find(i => i.severity === 'critical');
                        }
                    }
                }
                
                this.showErrorEditor(packName, filePath, entryName, errorIssue);
            });
        });
    },

    /**
     * Update UI after state change
     */
    updateUI() {
        // Update pack list
        const packList = this.modal.querySelector('#pack-list');
        if (packList) packList.innerHTML = this.renderPackList();

        // Update details
        const detailsContent = this.modal.querySelector('#details-content');
        if (detailsContent) detailsContent.innerHTML = this.renderDetailsPanel();

        // Update issues
        const issuesList = this.modal.querySelector('#issues-list');
        if (issuesList) issuesList.innerHTML = this.renderIssuesList();

        // Update filter buttons
        this.modal.querySelectorAll('.pack-import-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === this.issueFilter);
        });

        // Update summary
        const summary = this.modal.querySelector('.pack-import-summary-bar');
        if (summary) summary.innerHTML = this.renderSummaryBar();

        // Re-attach event listeners
        this.attachEventListeners();
    },

    /**
     * Start the import process
     */
    async startImport() {
        console.log('   selectedPacks:', Array.from(this.selectedPacks));
        console.log('   importOptions:', this.importOptions);
        console.log('   onImport callback:', !!this.onImport);
        
        if (this.selectedPacks.size === 0) {
            console.warn('No packs selected');
            return;
        }

        // Store references before closing modal
        const selectedPacksArray = Array.from(this.selectedPacks);
        const optionsCopy = { 
            ...this.importOptions,
            // Include file and entry selections
            selectedFiles: this.selectedFiles,
            selectedEntries: this.selectedEntries
        };
        const importCallback = this.onImport;

        // Close the modal first
        this.close();
        
        // Trigger import via callback
        if (importCallback) {
            try {
                await importCallback(selectedPacksArray, optionsCopy);
            } catch (error) {
                console.error('onImport callback error:', error);
            }
        } else {
            console.error('onImport callback is not set!');
        }
    },

    /**
     * Export diagnostic report
     */
    exportReport() {
        if (this.onExportReport) {
            this.onExportReport('markdown');
        }
    },

    /**
     * Show import options dialog
     */
    showImportOptions() {
        // Create options modal
        const optionsHtml = `
            <div class="import-options-modal">
                <div class="options-header">
                    <h4><i class="fas fa-cog"></i> Import Options</h4>
                </div>
                <div class="options-content">
                    <div class="option-group">
                        <label>Handling Missing References:</label>
                        <select id="opt-missing-refs">
                            <option value="placeholder" ${this.importOptions.missingReferences === 'placeholder' ? 'selected' : ''}>Create placeholder entries</option>
                            <option value="skip" ${this.importOptions.missingReferences === 'skip' ? 'selected' : ''}>Skip entries with missing refs</option>
                            <option value="ignore" ${this.importOptions.missingReferences === 'ignore' ? 'selected' : ''}>Import anyway</option>
                        </select>
                    </div>
                    <div class="option-group">
                        <label>On Parse Errors:</label>
                        <select id="opt-parse-errors">
                            <option value="skip" ${this.importOptions.onParseErrors === 'skip' ? 'selected' : ''}>Skip problematic files</option>
                            <option value="stop" ${this.importOptions.onParseErrors === 'stop' ? 'selected' : ''}>Stop on first error</option>
                        </select>
                    </div>
                    <div class="option-group">
                        <label>
                            <input type="checkbox" id="opt-warnings" ${this.importOptions.onWarnings ? 'checked' : ''}>
                            Import entries with warnings
                        </label>
                    </div>
                    <div class="option-group">
                        <label>Duplicate Handling:</label>
                        <select id="opt-duplicates">
                            <option value="skip" ${this.importOptions.duplicates === 'skip' ? 'selected' : ''}>Skip duplicates (keep existing)</option>
                            <option value="replace" ${this.importOptions.duplicates === 'replace' ? 'selected' : ''}>Replace duplicates</option>
                            <option value="rename" ${this.importOptions.duplicates === 'rename' ? 'selected' : ''}>Rename duplicates</option>
                        </select>
                    </div>
                </div>
                <div class="options-footer">
                    <button class="btn btn-secondary" id="options-cancel">Cancel</button>
                    <button class="btn btn-primary" id="options-apply">Apply</button>
                </div>
            </div>
        `;

        const overlay = document.createElement('div');
        overlay.className = 'options-overlay';
        overlay.innerHTML = optionsHtml;
        this.modal.appendChild(overlay);

        overlay.querySelector('#options-cancel').addEventListener('click', () => overlay.remove());
        overlay.querySelector('#options-apply').addEventListener('click', () => {
            this.importOptions.missingReferences = overlay.querySelector('#opt-missing-refs').value;
            this.importOptions.onParseErrors = overlay.querySelector('#opt-parse-errors').value;
            this.importOptions.onWarnings = overlay.querySelector('#opt-warnings').checked;
            this.importOptions.duplicates = overlay.querySelector('#opt-duplicates').value;
            overlay.remove();
        });
    },

    /**
     * Show file context in a popup
     */
    showFileContext(relativePath) {
        const parseData = this.parseResults.get(this.currentPack?.name);
        if (!parseData) return;

        const file = parseData.files.find(f => f.relativePath === relativePath);
        if (!file || !file.rawContent) return;

        const popup = document.createElement('div');
        popup.className = 'file-context-popup';
        popup.innerHTML = `
            <div class="popup-header">
                <h4>${relativePath}</h4>
                <button class="popup-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="popup-content">
                <pre class="code-block">${this.escapeHtml(file.rawContent)}</pre>
            </div>
        `;

        this.modal.appendChild(popup);

        popup.querySelector('.popup-close').addEventListener('click', () => popup.remove());
    },

    /**
     * Update import progress
     */
    updateImportProgress(progress, message) {
        // If modal exists, show progress overlay
        if (!this.modal) return;
        
        let progressOverlay = this.modal.querySelector('.pack-import-progress-overlay');
        if (!progressOverlay) {
            progressOverlay = document.createElement('div');
            progressOverlay.className = 'pack-import-progress-overlay';
            progressOverlay.innerHTML = `
                <div class="pack-import-progress-container">
                    <div class="pack-import-progress-icon">📦</div>
                    <h3 class="pack-import-progress-title">Importing Pack Files</h3>
                    <div class="pack-import-progress-percentage" id="import-progress-percentage">0%</div>
                    <div class="pack-import-progress-bar-container">
                        <div class="pack-import-progress-bar" id="import-progress-bar" style="width: 0%"></div>
                    </div>
                    <div class="pack-import-progress-text" id="import-progress-text">Preparing import...</div>
                    <div class="pack-import-progress-current-file" id="import-current-file-container" style="display: none;">
                        <div class="pack-import-progress-current-file-label">Current File</div>
                        <div class="pack-import-progress-current-file-name" id="import-current-file"></div>
                    </div>
                    <div class="pack-import-progress-details" id="import-progress-details">
                        <div class="pack-import-progress-detail-item">
                            <span class="pack-import-progress-detail-label">Files Processed</span>
                            <span class="pack-import-progress-detail-value" id="import-files-processed">0 / 0</span>
                        </div>
                        <div class="pack-import-progress-detail-item">
                            <span class="pack-import-progress-detail-label">Time Remaining</span>
                            <span class="pack-import-progress-detail-value" id="import-time-remaining">Calculating...</span>
                        </div>
                        <div class="pack-import-progress-detail-item">
                            <span class="pack-import-progress-detail-label">Current Pack</span>
                            <span class="pack-import-progress-detail-value" id="import-current-pack">-</span>
                        </div>
                        <div class="pack-import-progress-detail-item">
                            <span class="pack-import-progress-detail-label">Processing Speed</span>
                            <span class="pack-import-progress-detail-value" id="import-speed">-</span>
                        </div>
                    </div>
                    <button class="pack-import-btn pack-import-btn-danger pack-import-cancel-btn" id="cancel-import">
                        <i class="fas fa-times"></i> Cancel Import
                    </button>
                </div>
            `;
            this.modal.querySelector('.pack-import-modal')?.appendChild(progressOverlay);
            
            // Initialize progress tracking
            this.progressStartTime = Date.now();
            this.progressData = {
                filesProcessed: 0,
                totalFiles: 0,
                lastUpdate: Date.now()
            };
            
            // Attach cancel button event listener
            const cancelBtn = progressOverlay.querySelector('#cancel-import');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    if (window.packImporter?.executor) {
                        window.packImporter.executor.cancel();
                        if (window.notificationModal) {
                            window.notificationModal.alert('Import cancelled by user', 'info', 'Import Cancelled');
                        }
                    }
                });
            }
        }
        
        // Update progress data
        const percentageEl = progressOverlay.querySelector('#import-progress-percentage');
        const barEl = progressOverlay.querySelector('#import-progress-bar');
        const textEl = progressOverlay.querySelector('#import-progress-text');
        const filesProcessedEl = progressOverlay.querySelector('#import-files-processed');
        const timeRemainingEl = progressOverlay.querySelector('#import-time-remaining');
        const currentPackEl = progressOverlay.querySelector('#import-current-pack');
        const speedEl = progressOverlay.querySelector('#import-speed');
        const currentFileEl = progressOverlay.querySelector('#import-current-file');
        const currentFileContainer = progressOverlay.querySelector('#import-current-file-container');
        
        // Handle different message formats
        let percentage = 0;
        let statusText = message || 'Processing...';
        let currentFile = null;
        let currentPack = null;
        let filesProcessed = null;
        let totalFiles = null;
        
        // Check if progress is an object with detailed info
        if (typeof progress === 'object' && progress !== null) {
            percentage = progress.percentage || 0;
            statusText = progress.message || statusText;
            currentFile = progress.currentFile;
            currentPack = progress.packName;
            filesProcessed = progress.filesProcessed;
            totalFiles = progress.totalFiles;
        } else {
            // Simple number progress
            percentage = progress || 0;
        }
        
        // Update percentage display
        if (percentageEl) {
            percentageEl.textContent = `${Math.round(percentage)}%`;
        }
        
        // Update progress bar
        if (barEl) {
            barEl.style.width = `${percentage}%`;
        }
        
        // Update status text
        if (textEl) {
            textEl.textContent = statusText;
        }
        
        // Update current file
        if (currentFile && currentFileEl && currentFileContainer) {
            currentFileEl.textContent = currentFile;
            currentFileContainer.style.display = 'block';
        } else if (currentFileContainer) {
            currentFileContainer.style.display = 'none';
        }
        
        // Update files processed
        if (filesProcessed !== null && totalFiles !== null && filesProcessedEl) {
            filesProcessedEl.textContent = `${filesProcessed} / ${totalFiles}`;
            this.progressData.filesProcessed = filesProcessed;
            this.progressData.totalFiles = totalFiles;
        }
        
        // Update current pack
        if (currentPack && currentPackEl) {
            currentPackEl.textContent = currentPack;
        }
        
        // Calculate and update time remaining
        if (timeRemainingEl && this.progressData.totalFiles > 0) {
            const now = Date.now();
            const elapsed = now - this.progressStartTime;
            const processed = this.progressData.filesProcessed;
            const total = this.progressData.totalFiles;
            
            if (processed > 0 && processed < total) {
                const avgTimePerFile = elapsed / processed;
                const remaining = (total - processed) * avgTimePerFile;
                timeRemainingEl.textContent = this.formatTime(remaining);
                
                // Calculate speed
                if (speedEl) {
                    const filesPerSecond = (processed / elapsed) * 1000;
                    if (filesPerSecond >= 1) {
                        speedEl.textContent = `${filesPerSecond.toFixed(1)} files/sec`;
                    } else {
                        const secondsPerFile = 1 / filesPerSecond;
                        speedEl.textContent = `${secondsPerFile.toFixed(1)} sec/file`;
                    }
                }
            } else if (processed >= total) {
                timeRemainingEl.textContent = 'Finishing up...';
                if (speedEl) speedEl.textContent = 'Complete';
            }
        }
    },
    
    /**
     * Format time in milliseconds to human readable
     */
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else if (seconds > 0) {
            return `${seconds}s`;
        } else {
            return '< 1s';
        }
    },

    /**
     * Show import results
     */
    showImportResults(importResults, report) {
        // Create modal if it doesn't exist (was closed during import)
        if (!this.modal) {
            this.modal = document.createElement('div');
            this.modal.id = 'import-preview-modal';
            this.modal.className = 'pack-import-overlay';
            this.modal.innerHTML = '<div class="pack-import-modal"></div>';
            document.body.appendChild(this.modal);
        }
        
        const statusClass = importResults.success ? 
            (importResults.totalFailed > 0 ? 'partial' : 'success') : 'failed';
        const statusIcon = importResults.success ? 
            (importResults.totalFailed > 0 ? '⚠️' : '✅') : '❌';
        const statusTitle = importResults.success ? 
            (importResults.totalFailed > 0 ? 'Import Completed with Issues' : 'Import Successful!') : 'Import Failed';
        
        const modalContent = this.modal.querySelector('.pack-import-modal');
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="pack-import-header">
                    <h2>Import Results</h2>
                    <button class="pack-import-close-btn" id="close-import-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="pack-import-results">
                    <div class="pack-import-results-header ${statusClass}">
                        <div class="icon">${statusIcon}</div>
                        <h3>${statusTitle}</h3>
                        <p>Completed in ${(importResults.duration / 1000).toFixed(2)} seconds</p>
                    </div>
                    <div class="pack-import-results-grid">
                        <div class="pack-import-result-card success">
                            <div class="value">${importResults.totalImported}</div>
                            <div class="label">Imported</div>
                        </div>
                        <div class="pack-import-result-card skipped">
                            <div class="value">${importResults.totalSkipped}</div>
                            <div class="label">Skipped</div>
                        </div>
                        <div class="pack-import-result-card failed">
                            <div class="value">${importResults.totalFailed}</div>
                            <div class="label">Failed</div>
                        </div>
                        <div class="pack-import-result-card">
                            <div class="value">${importResults.placeholdersCreated?.length || 0}</div>
                            <div class="label">Placeholders Created</div>
                        </div>
                    </div>
                    <div class="pack-import-summary-actions" style="justify-content: center; margin-top: 24px;">
                        <button class="pack-import-btn pack-import-btn-primary" id="close-results">
                            <i class="fas fa-check"></i> Done
                        </button>
                    </div>
                </div>
            `;
            
            modalContent.querySelector('#close-import-modal')?.addEventListener('click', () => this.close());
            modalContent.querySelector('#close-results')?.addEventListener('click', () => this.close());
        }
    },

    /**
     * Close the modal
     */
    close() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    },

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
