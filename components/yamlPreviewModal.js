/**
 * YAML Preview Modal
 * Displays rendered YAML with syntax highlighting and copy functionality
 */

class YamlPreviewModal {
    constructor() {
        this.createModal();
        this.attachEventListeners();
    }

    /**
     * Create the modal HTML
     */
    createModal() {
        const modalHTML = `
            <div id="yamlPreviewOverlay" class="condition-modal" style="display: none; z-index: 10001;">
                <div class="modal-content condition-browser" style="max-width: 800px; max-height: 85vh;">
                    <!-- Header -->
                    <div class="modal-header">
                        <h2>
                            <i class="fas fa-file-code"></i>
                            YAML Preview
                        </h2>
                        <button class="btn-close" id="yamlPreviewClose" title="Close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <!-- Body -->
                    <div class="condition-browser-body" style="padding: 1.5rem; overflow-y: auto;">
                        <!-- Template Info -->
                        <div id="yamlTemplateInfo" style="margin-bottom: 1rem; padding: 1rem; background: var(--bg-tertiary); border-radius: 8px; border-left: 4px solid var(--primary-color);">
                            <div style="display: flex; align-items: start; gap: 1rem;">
                                <div style="font-size: 2rem;" id="yamlTemplateIcon">📝</div>
                                <div style="flex: 1;">
                                    <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;" id="yamlTemplateName">Template Name</h3>
                                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;" id="yamlTemplateDescription">Template description</p>
                                    <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem; flex-wrap: wrap;" id="yamlTemplateMeta"></div>
                                </div>
                            </div>
                        </div>

                        <!-- YAML Content -->
                        <div style="position: relative;">
                            <label style="font-weight: 600; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
                                <span>
                                    <i class="fas fa-code"></i> YAML Output
                                </span>
                                <button type="button" id="copyYamlBtn" class="btn btn-primary btn-sm">
                                    <i class="fas fa-copy"></i> Copy to Clipboard
                                </button>
                            </label>
                            <pre id="yamlPreviewContent" style="background: var(--bg-secondary); border: 2px solid var(--border-color); border-radius: 8px; padding: 1.5rem; margin: 0; overflow-x: auto; max-height: 500px; font-family: 'Courier New', monospace; font-size: 0.9rem; line-height: 1.6; white-space: pre; color: var(--text-primary);"><code></code></pre>
                        </div>

                        <!-- Export Options -->
                        <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-tertiary); border-radius: 8px;">
                            <h4 style="margin: 0 0 0.75rem 0; font-size: 0.95rem;">
                                <i class="fas fa-download"></i> Export Options
                            </h4>
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                <button type="button" id="downloadYmlBtn" class="btn btn-secondary btn-sm">
                                    <i class="fas fa-file-download"></i> Download as .yml
                                </button>
                                <button type="button" id="downloadYamlBtn" class="btn btn-secondary btn-sm">
                                    <i class="fas fa-file-download"></i> Download as .yaml
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="yamlPreviewCloseBtn">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        const temp = document.createElement('div');
        temp.innerHTML = modalHTML;
        document.body.appendChild(temp.firstElementChild);

        this.injectStyles();
    }

    /**
     * Inject syntax highlighting CSS
     */
    injectStyles() {
        if (document.getElementById('yamlPreviewStyles')) return;
        
        const styles = `
            <style id="yamlPreviewStyles">
                #yamlPreviewContent code {
                    color: var(--text-primary);
                }
                
                /* YAML Syntax Highlighting */
                #yamlPreviewContent .yaml-comment {
                    color: #6a9955;
                    font-style: italic;
                }
                
                #yamlPreviewContent .yaml-key {
                    color: #4fc3f7;
                    font-weight: 600;
                }
                
                #yamlPreviewContent .yaml-string {
                    color: #ce9178;
                }
                
                #yamlPreviewContent .yaml-number {
                    color: #b5cea8;
                }
                
                #yamlPreviewContent .yaml-boolean {
                    color: #569cd6;
                    font-weight: 600;
                }
                
                #yamlPreviewContent .yaml-null {
                    color: #569cd6;
                    font-style: italic;
                }
                
                #yamlPreviewContent .yaml-array-marker {
                    color: #dcdcaa;
                    font-weight: bold;
                }
                
                /* Copy button animation */
                #copyYamlBtn.copied {
                    background: #4caf50 !important;
                    border-color: #4caf50 !important;
                }
                
                #copyYamlBtn.copied i::before {
                    content: "\\f00c"; /* fa-check */
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const overlay = document.getElementById('yamlPreviewOverlay');
        const closeBtn = document.getElementById('yamlPreviewClose');
        const closeBtnFooter = document.getElementById('yamlPreviewCloseBtn');
        const copyBtn = document.getElementById('copyYamlBtn');
        const downloadYmlBtn = document.getElementById('downloadYmlBtn');
        const downloadYamlBtn = document.getElementById('downloadYamlBtn');

        // Close handlers
        closeBtn.addEventListener('click', () => this.close());
        closeBtnFooter.addEventListener('click', () => this.close());
        
        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.style.display !== 'none') {
                this.close();
            }
        });

        // Copy to clipboard
        copyBtn.addEventListener('click', () => this.copyToClipboard());

        // Download handlers
        downloadYmlBtn.addEventListener('click', () => this.download('yml'));
        downloadYamlBtn.addEventListener('click', () => this.download('yaml'));
    }

    /**
     * Open the modal with YAML content
     * @param {Object} template - Template object to preview
     * @param {string} yamlContent - Pre-rendered YAML string (optional)
     */
    open(template, yamlContent = null) {
        this.currentTemplate = template;
        
        // Generate YAML if not provided
        if (!yamlContent && window.templateImportExport) {
            yamlContent = window.templateImportExport.exportToYAML(template);
        }
        
        this.currentYaml = yamlContent;

        // Populate template info
        this.populateTemplateInfo(template);

        // Display YAML with syntax highlighting
        this.displayYaml(yamlContent);

        // Show modal
        document.getElementById('yamlPreviewOverlay').style.display = 'flex';
    }

    /**
     * Populate template information section
     * @param {Object} template - Template object
     */
    populateTemplateInfo(template) {
        const icon = document.getElementById('yamlTemplateIcon');
        const name = document.getElementById('yamlTemplateName');
        const description = document.getElementById('yamlTemplateDescription');
        const meta = document.getElementById('yamlTemplateMeta');

        // Set icon
        icon.textContent = template.icon || '📝';

        // Set name
        name.textContent = template.name || 'Untitled Template';

        // Set description
        description.textContent = template.description || 'No description provided';

        // Build metadata badges
        const badges = [];

        // Structure type badge
        if (template.structure_type) {
            const structureInfo = this.getStructureInfo(template.structure_type);
            badges.push(`<span style="background: ${structureInfo.color}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.375rem;">${structureInfo.icon} ${structureInfo.label}</span>`);
        }

        // Official badge
        if (template.is_official) {
            badges.push(`<span class="official-badge" style="font-size: 0.85rem; padding: 0.25rem 0.75rem;">👑 Official</span>`);
        }

        // Category badge
        if (template.category) {
            badges.push(`<span style="background: var(--bg-secondary); color: var(--text-secondary); padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; border: 1px solid var(--border-color);">${template.category}</span>`);
        }

        // Difficulty badge
        if (template.difficulty) {
            const difficultyColors = {
                beginner: '#4caf50',
                intermediate: '#ff9800',
                advanced: '#f44336'
            };
            const color = difficultyColors[template.difficulty] || '#757575';
            badges.push(`<span style="background: ${color}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">${template.difficulty}</span>`);
        }

        // Line/section count
        const structureInfo = window.templateManager?.detectStructureType(template);
        if (structureInfo) {
            if (structureInfo.sectionCount > 1) {
                badges.push(`<span style="background: var(--primary-color); color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">${structureInfo.sectionCount} sections • ${structureInfo.lineCount} lines</span>`);
            } else {
                badges.push(`<span style="background: var(--primary-color); color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">${structureInfo.lineCount} ${structureInfo.lineCount === 1 ? 'line' : 'lines'}</span>`);
            }
        }

        meta.innerHTML = badges.join('');
    }

    /**
     * Get structure type display info
     * @param {string} structureType 
     * @returns {Object}
     */
    getStructureInfo(structureType) {
        const infoMap = {
            'single': { icon: '🎯', label: 'Single Line', color: '#10b981' },
            'multi-line': { icon: '📋', label: 'Multi-Line', color: '#3b82f6' },
            'multi-section': { icon: '📚', label: 'Multi-Section', color: '#8b5cf6' }
        };
        return infoMap[structureType] || infoMap['multi-line'];
    }

    /**
     * Display YAML with syntax highlighting
     * @param {string} yaml - YAML string
     */
    displayYaml(yaml) {
        const codeElement = document.querySelector('#yamlPreviewContent code');
        
        if (!yaml) {
            codeElement.textContent = '# No YAML content available';
            return;
        }

        // Apply syntax highlighting
        const highlighted = this.highlightYaml(yaml);
        codeElement.innerHTML = highlighted;
    }

    /**
     * Simple YAML syntax highlighter
     * @param {string} yaml - Raw YAML string
     * @returns {string} - HTML with syntax highlighting
     */
    highlightYaml(yaml) {
        const lines = yaml.split('\n');
        const highlighted = lines.map(line => {
            // Comments
            if (line.trim().startsWith('#')) {
                return `<span class="yaml-comment">${this.escapeHtml(line)}</span>`;
            }

            // Key-value pairs
            const keyValueMatch = line.match(/^(\s*)([a-zA-Z_][a-zA-Z0-9_-]*)\s*:\s*(.*)$/);
            if (keyValueMatch) {
                const indent = keyValueMatch[1];
                const key = keyValueMatch[2];
                const value = keyValueMatch[3];

                let highlightedValue = value;

                // Highlight value based on type
                if (!value || value === '') {
                    // Empty value
                    highlightedValue = '';
                } else if (value === 'true' || value === 'false') {
                    highlightedValue = `<span class="yaml-boolean">${value}</span>`;
                } else if (value === 'null' || value === '~') {
                    highlightedValue = `<span class="yaml-null">${value}</span>`;
                } else if (/^-?\d+(\.\d+)?$/.test(value)) {
                    highlightedValue = `<span class="yaml-number">${value}</span>`;
                } else if (value.startsWith('"') || value.startsWith("'")) {
                    highlightedValue = `<span class="yaml-string">${this.escapeHtml(value)}</span>`;
                } else {
                    highlightedValue = this.escapeHtml(value);
                }

                return `${indent}<span class="yaml-key">${key}</span>: ${highlightedValue}`;
            }

            // Array markers
            if (line.trim().startsWith('- ')) {
                const indent = line.match(/^(\s*)/)[1];
                const content = line.substring(indent.length + 2);
                return `${indent}<span class="yaml-array-marker">-</span> ${this.escapeHtml(content)}`;
            }

            // Default (plain text)
            return this.escapeHtml(line);
        });

        return highlighted.join('\n');
    }

    /**
     * Escape HTML special characters
     * @param {string} text 
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Copy YAML to clipboard
     */
    async copyToClipboard() {
        const copyBtn = document.getElementById('copyYamlBtn');
        
        try {
            await navigator.clipboard.writeText(this.currentYaml);
            
            // Visual feedback
            copyBtn.classList.add('copied');
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = originalHTML;
            }, 2000);

            this.showNotification('YAML copied to clipboard', 'success');
        } catch (err) {
            console.error('Failed to copy:', err);
            this.showNotification('Failed to copy to clipboard', 'error');
        }
    }

    /**
     * Download YAML as file
     * @param {string} extension - File extension ('yml' or 'yaml')
     */
    download(extension = 'yml') {
        if (!this.currentTemplate || !this.currentYaml) {
            this.showNotification('No YAML content to download', 'error');
            return;
        }

        const filename = `${this.sanitizeFilename(this.currentTemplate.name)}.${extension}`;
        const blob = new Blob([this.currentYaml], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification(`Downloaded as ${filename}`, 'success');
    }

    /**
     * Sanitize filename
     * @param {string} name 
     * @returns {string}
     */
    sanitizeFilename(name) {
        return name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    }

    /**
     * Close the modal
     */
    close() {
        document.getElementById('yamlPreviewOverlay').style.display = 'none';
        this.currentTemplate = null;
        this.currentYaml = null;
    }

    /**
     * Show notification
     * @param {string} message 
     * @param {string} type - 'success' or 'error'
     */
    showNotification(message, type = 'info') {
        if (window.notificationModal) {
            window.notificationModal.show(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.YamlPreviewModal = YamlPreviewModal;
}
