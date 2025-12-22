/**
 * Backup Manager Tool
 * Manages pack backups with auto-backup every 30 minutes (max 10 backups)
 */
class BackupManager {
    constructor(editor) {
        this.editor = editor;
        this.maxBackups = 10;
        this.autoBackupInterval = 30 * 60 * 1000; // 30 minutes in milliseconds
        this.autoBackupTimer = null;
        this.storageKey = 'mythicmobs_backups';
        
        // Start auto-backup
        this.startAutoBackup();
    }
    
    /**
     * Start auto-backup timer
     */
    startAutoBackup() {
        // Clear existing timer
        if (this.autoBackupTimer) {
            clearInterval(this.autoBackupTimer);
        }
        
        // Set new timer
        this.autoBackupTimer = setInterval(() => {
            if (this.editor.state.currentPack) {
                this.createBackup(true); // true = auto-backup
            }
        }, this.autoBackupInterval);
    }
    
    /**
     * Create a new backup
     * @param {boolean} isAuto - Whether this is an auto-backup
     */
    createBackup(isAuto = false) {
        const pack = this.editor.state.currentPack;
        if (!pack) {
            this.editor.showToast('No pack loaded', 'warning');
            return;
        }
        
        const backups = this.getBackups();
        
        const backup = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            packName: pack.name || 'Unnamed Pack',
            type: isAuto ? 'auto' : 'manual',
            data: JSON.parse(JSON.stringify(pack)) // Deep clone
        };
        
        backups.push(backup);
        
        // Keep only last 10 backups
        if (backups.length > this.maxBackups) {
            backups.shift(); // Remove oldest
        }
        
        this.saveBackups(backups);
        
        if (!isAuto) {
            this.editor.showToast('Backup created successfully', 'success');
        }
    }
    
    /**
     * Get all backups from storage
     */
    getBackups() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading backups:', error);
            return [];
        }
    }
    
    /**
     * Save backups to storage
     */
    saveBackups(backups) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(backups));
        } catch (error) {
            console.error('Error saving backups:', error);
            this.editor.showToast('Failed to save backup', 'error');
        }
    }
    
    /**
     * Delete a backup
     * @param {number} backupId - ID of backup to delete
     */
    deleteBackup(backupId) {
        const backups = this.getBackups();
        const filtered = backups.filter(b => b.id !== backupId);
        this.saveBackups(filtered);
        
        // Refresh modal if open
        if (document.getElementById('backup-manager-modal')) {
            document.getElementById('backup-manager-modal').remove();
            this.show();
        }
        
        this.editor.showToast('Backup deleted', 'success');
    }
    
    /**
     * Restore a backup
     * @param {number} backupId - ID of backup to restore
     */
    restoreBackup(backupId) {
        const backups = this.getBackups();
        const backup = backups.find(b => b.id === backupId);
        
        if (!backup) {
            this.editor.showToast('Backup not found', 'error');
            return;
        }
        
        // Confirm restoration
        if (window.notificationModal) {
            window.notificationModal.confirm(
                'Restore Backup',
                `Are you sure you want to restore the backup from ${this._formatDate(backup.timestamp)}? Current unsaved changes will be lost.`,
                () => {
                    this._performRestore(backup);
                }
            );
        } else {
            if (confirm(`Restore backup from ${this._formatDate(backup.timestamp)}?`)) {
                this._performRestore(backup);
            }
        }
    }
    
    /**
     * Perform backup restoration
     */
    _performRestore(backup) {
        this.editor.state.currentPack = JSON.parse(JSON.stringify(backup.data));
        this.editor.saveCurrentPack();
        this.editor.refreshUI();
        
        // Close modal
        document.getElementById('backup-manager-modal')?.remove();
        
        this.editor.showToast('Backup restored successfully', 'success');
    }
    
    /**
     * Export backup to file
     * @param {number} backupId - ID of backup to export
     * @param {string} format - 'json' or 'yml'
     */
    exportBackup(backupId, format = 'json') {
        const backups = this.getBackups();
        const backup = backups.find(b => b.id === backupId);
        
        if (!backup) {
            this.editor.showToast('Backup not found', 'error');
            return;
        }
        
        let content, filename, mimeType;
        
        if (format === 'json') {
            content = JSON.stringify(backup.data, null, 2);
            filename = `backup_${backup.packName}_${backup.id}.json`;
            mimeType = 'application/json';
        } else if (format === 'yml') {
            content = this._convertToYAML(backup.data);
            filename = `backup_${backup.packName}_${backup.id}.yml`;
            mimeType = 'text/yaml';
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        this.editor.showToast(`Backup exported as ${format.toUpperCase()}`, 'success');
    }
    
    /**
     * Convert pack data to YAML format
     */
    _convertToYAML(data) {
        // Simple YAML conversion (can be enhanced with a YAML library)
        let yaml = '';
        
        const categories = ['mobs', 'skills', 'items', 'droptables', 'randomspawns'];
        
        categories.forEach(category => {
            if (data[category] && Object.keys(data[category]).length > 0) {
                yaml += `${category}:\n`;
                Object.entries(data[category]).forEach(([name, content]) => {
                    yaml += `  ${name}:\n`;
                    yaml += this._objectToYAML(content, 4);
                });
                yaml += '\n';
            }
        });
        
        return yaml;
    }
    
    /**
     * Convert object to YAML string
     */
    _objectToYAML(obj, indent = 0) {
        let yaml = '';
        const spaces = ' '.repeat(indent);
        
        Object.entries(obj).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                yaml += `${spaces}${key}:\n`;
                value.forEach(item => {
                    yaml += `${spaces}  - ${item}\n`;
                });
            } else if (typeof value === 'object' && value !== null) {
                yaml += `${spaces}${key}:\n`;
                yaml += this._objectToYAML(value, indent + 2);
            } else {
                yaml += `${spaces}${key}: ${value}\n`;
            }
        });
        
        return yaml;
    }
    
    /**
     * Show backup manager modal
     */
    show() {
        const backups = this.getBackups();
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'backup-manager-modal';
        
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>
                        <i class="fas fa-save"></i>
                        Backup Manager
                    </h2>
                    <button class="btn-close" onclick="document.getElementById('backup-manager-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <!-- Info Banner -->
                    <div class="backup-info-banner">
                        <div class="info-item">
                            <i class="fas fa-clock"></i>
                            <span>Auto-backup every 30 minutes</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-database"></i>
                            <span>Max ${this.maxBackups} backups retained</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-save"></i>
                            <span>${backups.length} backup(s) stored</span>
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="backup-actions">
                        <button class="btn btn-primary" onclick="window.backupManagerInstance.createBackup()">
                            <i class="fas fa-plus"></i> Create Manual Backup
                        </button>
                    </div>
                    
                    ${backups.length === 0 ? `
                        <div class="backup-empty">
                            <i class="fas fa-save"></i>
                            <h3>No Backups Yet</h3>
                            <p>Backups will be created automatically every 30 minutes, or you can create one manually.</p>
                        </div>
                    ` : `
                        <!-- Backups List -->
                        <div class="backups-list">
                            ${backups.slice().reverse().map(backup => this._renderBackupItem(backup)).join('')}
                        </div>
                    `}
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('backup-manager-modal').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Store instance for callbacks
        window.backupManagerInstance = this;
    }
    
    /**
     * Render a backup item
     */
    _renderBackupItem(backup) {
        return `
            <div class="backup-item ${backup.type}">
                <div class="backup-icon">
                    <i class="fas ${backup.type === 'auto' ? 'fa-clock' : 'fa-user'}"></i>
                </div>
                <div class="backup-info">
                    <div class="backup-header">
                        <strong>${backup.packName}</strong>
                        <span class="backup-badge ${backup.type}">${backup.type}</span>
                    </div>
                    <div class="backup-meta">
                        <span><i class="fas fa-calendar"></i> ${this._formatDate(backup.timestamp)}</span>
                        <span><i class="fas fa-clock"></i> ${this._formatTime(backup.timestamp)}</span>
                    </div>
                </div>
                <div class="backup-actions-menu">
                    <button class="btn btn-sm btn-primary" onclick="window.backupManagerInstance.restoreBackup(${backup.id})" title="Restore">
                        <i class="fas fa-undo"></i>
                    </button>
                    <div class="backup-export-dropdown">
                        <button class="btn btn-sm btn-secondary" onclick="this.nextElementSibling.classList.toggle('active')" title="Export">
                            <i class="fas fa-download"></i>
                        </button>
                        <div class="export-options">
                            <button onclick="window.backupManagerInstance.exportBackup(${backup.id}, 'json')">
                                <i class="fas fa-file-code"></i> JSON
                            </button>
                            <button onclick="window.backupManagerInstance.exportBackup(${backup.id}, 'yml')">
                                <i class="fas fa-file-alt"></i> YAML
                            </button>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="window.backupManagerInstance.deleteBackup(${backup.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Format date for display
     */
    _formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    /**
     * Format time for display
     */
    _formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
