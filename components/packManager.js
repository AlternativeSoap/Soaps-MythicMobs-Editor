/**
 * Pack Manager - Handles pack creation, management, and rendering
 */
class PackManager {
    constructor(editor) {
        this.editor = editor;
        this.packs = [];
        this.activePack = null;
        this.openDropdownPackId = null;
        this.savePacksDebounce = null; // Debounce timer for batching saves
        
        // New features
        this.contextMenu = null;
        this.searchQuery = '';
        this.recentFiles = [];
        this.favorites = new Set();
        this.fileStatuses = new Map(); // fileId -> {modified, error, synced}
        this._favoritesMetadataCache = null; // Cache to prevent repeated 406 errors
        
        // Event listener flags to prevent duplication
        this._recentFilesToggleSetup = false;
        this._favoritesToggleSetup = false;
        this._recentFilesClickDelegationSetup = false;
        this._favoritesClickDelegationSetup = false;
        this._searchSetup = false;
        
        // Initialize features
        this.initializeFeatures();
    }
    
    /**
     * Initialize new features (search, recent files, favorites, context menu)
     */
    initializeFeatures() {
        // Initialize context menu
        if (typeof ContextMenu !== 'undefined') {
            this.contextMenu = new ContextMenu();
            this.setupContextMenuActions();
        }
        
        // Load recent files from storage
        this.loadRecentFiles();
        
        // Load favorites from storage
        this.loadFavorites();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Setup toggle handlers (only once)
        this.setupRecentFilesToggle();
        this.setupFavoritesToggle();
        
        // Setup click delegation for items (only once)
        this.setupRecentFilesClickDelegation();
        this.setupFavoritesClickDelegation();
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+F to focus search
            if (e.ctrlKey && e.key === 'f' && !e.shiftKey) {
                const searchInput = document.getElementById('pack-search-input');
                if (searchInput && document.activeElement !== searchInput) {
                    e.preventDefault();
                    searchInput.focus();
                    searchInput.select();
                }
            }
        });
    }
    
    /**
     * Setup context menu actions
     */
    setupContextMenuActions() {
        if (!this.contextMenu) return;
        
        this.contextMenu.registerAction('open', (data) => {
            if (data.fileId && data.fileType) {
                this.openFile(data.fileId, data.fileType);
            }
        });
        
        this.contextMenu.registerAction('duplicate', (data) => {
            if (data.fileId && data.fileType) {
                this.duplicateFile(data.fileId, data.fileType);
            }
        });
        
        this.contextMenu.registerAction('delete', (data) => {
            if (data.fileId && data.fileType) {
                this.deleteFile(data.fileId, data.fileType);
            }
        });
        
        this.contextMenu.registerAction('export', (data) => {
            if (data.fileId && data.fileType) {
                this.exportFile(data.fileId, data.fileType);
            }
        });
        
        this.contextMenu.registerAction('copyName', (data) => {
            if (data.fileName) {
                navigator.clipboard.writeText(data.fileName);
                this.editor.showToast('Name copied to clipboard', 'success');
            }
        });
        
        this.contextMenu.registerAction('toggleFavorite', (data) => {
            if (data.fileId) {
                this.toggleFavorite(data.fileId, data.fileName, data.fileType, data.packName);
            }
        });
    }
    
    async loadPacks() {
        if (window.DEBUG_MODE) {
        }
        
        const saved = await this.editor.storage.get('packs');
        
        if (window.DEBUG_MODE) {
            console.log('📦 Loaded packs:', {
                found: !!saved,
                packCount: saved?.length || 0,
                totalSkills: saved?.reduce((sum, p) => sum + (p.skills?.length || 0), 0) || 0
            });
        }
        
        if (saved && saved.length > 0) {
            this.packs = saved;
            // Ensure all packs have packinfo
            this.packs.forEach(pack => {
                if (!pack.packinfo) {
                    pack.packinfo = this.createDefaultPackInfo(pack.name);
                }
            });
            this.activePack = this.packs[0];
        } else {
            // Create default pack
            const defaultPack = await this.createPack('My First Pack');
            this.activePack = defaultPack;
        }
        
        this.editor.state.currentPack = this.activePack;
        return this.packs;
    }
    
    async createPack(name) {
        const pack = {
            id: Date.now().toString(),
            name: name,
            description: '',
            version: '1.0.0',
            author: '',
            icon: {
                material: 'CHEST',
                model: 0
            },
            url: '',
            created: new Date().toISOString(),
            mobs: [],
            skills: [],
            items: [],
            droptables: [],
            randomspawns: [],
            assets: [],
            packinfo: this.createDefaultPackInfo(name),
            tooltips: []
        };
        
        this.packs.push(pack);
        this.savePacks();
        return pack;
    }
    
    createDefaultPackInfo(packName) {
        return {
            Name: packName,
            Version: '1.0.0',
            Author: '',
            Icon: {
                Material: 'DIAMOND',
                Model: 0
            },
            URL: '',
            Description: ['A MythicMobs pack created with Soap\'s Editor']
        };
    }
    
    async savePacks(immediate = false) {
        // For immediate saves (manual save/save all), skip debounce
        if (immediate) {
            return await this._performSave();
        }
        
        // Debounce saves to avoid excessive storage writes during bulk operations
        clearTimeout(this.savePacksDebounce);
        
        return new Promise((resolve, reject) => {
            this.savePacksDebounce = setTimeout(async () => {
                try {
                    await this._performSave();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }, 350); // 350ms debounce window
        });
    }
    
    async _performSave() {
        try {
            // Update sync status UI
            if (this.editor.authUI) {
                this.editor.authUI.setSyncStatus('syncing');
            }
            
            if (window.DEBUG_MODE) {
                console.log('💾 Saving packs to storage...', {
                    packCount: this.packs.length,
                    totalSkills: this.packs.reduce((sum, p) => sum + (p.skills?.length || 0), 0),
                    userId: this.editor.storage.db?.userId || 'unknown'
                });
            }
            
            // Save with verification
            await this.editor.storage.set('packs', this.packs);
            
            // Verify the save
            const verification = await this.editor.storage.get('packs');
            if (!verification || verification.length !== this.packs.length) {
                throw new Error('Save verification failed - data mismatch');
            }
            
            // Show success
            if (this.editor.authUI) {
                this.editor.authUI.showSyncSuccess();
            }
            
            return true;
        } catch (error) {
            console.error('❌ Failed to save packs:', error);
            if (this.editor.authUI) {
                this.editor.authUI.showSyncError();
            }
            throw error;
        }
    }
    
    /**
     * Get a pack by name
     */
    getPack(name) {
        return this.packs.find(p => p.name === name);
    }
    
    /**
     * Get a pack by ID
     */
    getPackById(id) {
        return this.packs.find(p => p.id === id);
    }
    
    /**
     * Refresh the pack tree UI
     */
    refresh() {
        this.renderPackTree();
    }
    
    /**
     * Alias for renderPackTree - used by editors
     */
    render() {
        this.renderPackTree();
    }
    
    setActivePack(pack) {
        this.activePack = pack;
        this.editor.state.currentPack = pack;
        this.renderPackTree();
    }
    
    renderPackTree() {
        const container = document.getElementById('pack-tree');
        if (!container) return;
        
        if (this.packs.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No packs yet. Create one to get started!</p></div>';
            return;
        }
        
        container.innerHTML = this.packs.map(pack => this.renderPackItem(pack)).join('');
        this.attachPackEventListeners();
        
        // Setup search and render features
        this.setupSearch();
        this.renderRecentFiles();
        this.renderFavorites();
        
        // Setup toggles and click delegation (will only run once when DOM is ready)
        this.setupRecentFilesToggle();
        this.setupFavoritesToggle();
        this.setupRecentFilesClickDelegation();
        this.setupFavoritesClickDelegation();
        
        // Restore search state if there was an active search
        this.restoreSearchState();
    }
    
    renderPackItem(pack) {
        const isActive = this.activePack && this.activePack.id === pack.id;
        const collapsedStates = this.getCollapsedStates();
        const isCollapsed = collapsedStates[pack.id] || false;
        const isDropdownOpen = this.openDropdownPackId === pack.id;
        
        return `
            <div class="pack-item" data-pack-id="${pack.id}" draggable="true">
                <div class="pack-header ${isActive ? 'active' : ''}" data-pack-id="${pack.id}">
                    <i class="fas fa-grip-vertical pack-drag-handle" title="Drag to reorder"></i>
                    <i class="fas fa-chevron-right pack-chevron ${isCollapsed ? '' : 'rotated'}"></i>
                    <div class="pack-title">
                        <i class="fas fa-cube"></i>
                        <span>${pack.name}</span>
                    </div>
                    <div class="pack-actions">
                        <button class="icon-btn pack-settings" data-pack-id="${pack.id}" title="Pack Settings">
                            <i class="fas fa-cog"></i>
                        </button>
                        <div class="pack-dropdown ${isDropdownOpen ? 'open' : ''}" data-pack-id="${pack.id}" style="display: ${isDropdownOpen ? 'block' : 'none'};">
                            <button class="pack-dropdown-item" data-action="rename" data-pack-id="${pack.id}">
                                <i class="fas fa-edit"></i> Rename Pack
                            </button>
                            <button class="pack-dropdown-item" data-action="duplicate" data-pack-id="${pack.id}">
                                <i class="fas fa-copy"></i> Duplicate Pack
                            </button>
                            <button class="pack-dropdown-item" data-action="export" data-pack-id="${pack.id}">
                                <i class="fas fa-file-export"></i> Export Pack
                            </button>
                            <button class="pack-dropdown-item delete" data-action="delete" data-pack-id="${pack.id}">
                                <i class="fas fa-trash"></i> Delete Pack
                            </button>
                        </div>
                    </div>
                </div>
                <div class="pack-content ${isCollapsed ? 'collapsed' : 'expanded'}">
                    ${this.renderPackFolders(pack)}
                </div>
            </div>
        `;
    }
    
    renderPackFolders(pack) {
        const folderStates = this.getFolderStates();
        const fileStates = this.getFileStates();
        
        const getFolderClasses = (folderName) => {
            const isExpanded = folderStates[folderName];
            return isExpanded ? '' : 'collapsed';
        };
        
        const getChevronClass = (folderName) => {
            const isExpanded = folderStates[folderName];
            return isExpanded ? 'fa-chevron-down' : 'fa-chevron-right';
        };
        
        // Helper to count total entries across all files
        const getTotalEntries = (collection) => {
            if (!collection || !Array.isArray(collection)) return 0;
            // Always file-based structure
            return collection.reduce((sum, file) => sum + (file.entries?.length || 0), 0);
        };
        
        return `
            <!-- Pack Configuration Files -->
            <div class="folder-item config-files">
                <div class="file-item config-file" data-file-type="packinfo">
                    <i class="fas fa-info-circle file-icon"></i>
                    <span>packinfo.yml</span>
                </div>
                <div class="file-item config-file" data-file-type="tooltips">
                    <i class="fas fa-file-alt file-icon"></i>
                    <span>tooltips.yml</span>
                </div>
            </div>
            
            <!-- Assets Folder -->
            <div class="folder-item" data-folder-name="assets">
                <div class="folder-header collapsible" data-folder="assets">
                    <i class="fas ${getChevronClass('assets')} folder-chevron"></i>
                    <i class="fas fa-folder folder-icon"></i>
                    <span>Assets</span>
                    <span class="badge">${pack.assets?.length || 0}</span>
                </div>
                <div class="folder-files ${getFolderClasses('assets')}">
                    ${(pack.assets || []).map(asset => this.renderFileItem(asset, 'asset')).join('')}
                    <div class="folder-info">Model files, textures, sounds</div>
                </div>
            </div>
            
            <!-- DropTables Folder -->
            <div class="folder-item" data-folder-name="droptables">
                <div class="folder-header collapsible" data-folder="droptables">
                    <i class="fas ${getChevronClass('droptables')} folder-chevron"></i>
                    <i class="fas fa-folder folder-icon"></i>
                    <span>DropTables</span>
                    <span class="badge">${getTotalEntries(pack.droptables)}</span>
                </div>
                <div class="folder-files ${getFolderClasses('droptables')}">
                    ${this.renderFileBasedCollection(pack.droptables, 'droptable', fileStates)}
                    <button class="add-item-btn" data-type="droptable" data-pack-id="${pack.id}">
                        <i class="fas fa-plus"></i> New DropTable
                    </button>
                </div>
            </div>
            
            <!-- Items Folder -->
            <div class="folder-item" data-folder-name="items">
                <div class="folder-header collapsible" data-folder="items">
                    <i class="fas ${getChevronClass('items')} folder-chevron"></i>
                    <i class="fas fa-folder folder-icon"></i>
                    <span>Items</span>
                    <span class="badge">${getTotalEntries(pack.items)}</span>
                </div>
                <div class="folder-files ${getFolderClasses('items')}">
                    ${this.renderFileBasedCollection(pack.items, 'item', fileStates)}
                    <button class="add-item-btn" data-type="item" data-pack-id="${pack.id}">
                        <i class="fas fa-plus"></i> New Item
                    </button>
                </div>
            </div>
            
            <!-- Mobs Folder -->
            <div class="folder-item" data-folder-name="mobs">
                <div class="folder-header collapsible" data-folder="mobs">
                    <i class="fas ${getChevronClass('mobs')} folder-chevron"></i>
                    <i class="fas fa-folder folder-icon"></i>
                    <span>Mobs</span>
                    <span class="badge">${getTotalEntries(pack.mobs)}</span>
                </div>
                <div class="folder-files ${getFolderClasses('mobs')}">
                    ${this.renderFileBasedCollection(pack.mobs, 'mob', fileStates)}
                    <button class="add-item-btn" data-type="mob" data-pack-id="${pack.id}">
                        <i class="fas fa-plus"></i> New Mob
                    </button>
                </div>
            </div>
            
            <!-- RandomSpawns Folder -->
            <div class="folder-item" data-folder-name="randomspawns">
                <div class="folder-header collapsible" data-folder="randomspawns">
                    <i class="fas ${getChevronClass('randomspawns')} folder-chevron"></i>
                    <i class="fas fa-folder folder-icon"></i>
                    <span>RandomSpawns</span>
                    <span class="badge">${getTotalEntries(pack.randomspawns)}</span>
                </div>
                <div class="folder-files ${getFolderClasses('randomspawns')}">
                    ${this.renderFileBasedCollection(pack.randomspawns, 'randomspawn', fileStates)}
                    <button class="add-item-btn" data-type="randomspawn" data-pack-id="${pack.id}">
                        <i class="fas fa-plus"></i> New RandomSpawn
                    </button>
                </div>
            </div>
            
            <!-- Skills Folder -->
            <div class="folder-item" data-folder-name="skills">
                <div class="folder-header collapsible" data-folder="skills">
                    <i class="fas ${getChevronClass('skills')} folder-chevron"></i>
                    <i class="fas fa-folder folder-icon"></i>
                    <span>Skills</span>
                    <span class="badge">${getTotalEntries(pack.skills)}</span>
                </div>
                <div class="folder-files ${getFolderClasses('skills')}">
                    ${this.renderFileBasedCollection(pack.skills, 'skill', fileStates)}
                    <button class="add-item-btn" data-type="skill" data-pack-id="${pack.id}">
                        <i class="fas fa-plus"></i> New Skill
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Render file-based collection (files containing entries)
     * Always uses file-based structure
     */
    renderFileBasedCollection(collection, type, fileStates) {
        if (!collection || !Array.isArray(collection) || collection.length === 0) {
            return '';
        }
        
        // Always render as file-based structure
        // Migrate any legacy flat entries on-the-fly for display
        const isFileBased = collection.length > 0 && collection[0].entries !== undefined;
        
        if (isFileBased) {
            return collection.map(file => this.renderYamlFile(file, type, fileStates)).join('');
        } else {
            // Legacy data detected - migrate it to file-based structure
            this.migrateLegacyCollection(type);
            // Re-render after migration
            const migratedCollection = this.activePack[type + 's'];
            if (migratedCollection && migratedCollection.length > 0 && migratedCollection[0].entries) {
                return migratedCollection.map(file => this.renderYamlFile(file, type, fileStates)).join('');
            }
            return '';
        }
    }
    
    /**
     * Migrate legacy flat collection to file-based structure
     */
    migrateLegacyCollection(type) {
        if (!this.activePack) return;
        
        const collection = this.activePack[type + 's'];
        if (!collection || collection.length === 0) return;
        
        // Check if already file-based
        if (collection[0].entries !== undefined) return;
        
        console.log(`🔄 Migrating legacy ${type}s to file-based structure...`);
        
        // Create a single file containing all legacy entries
        const legacyFileName = 'Migrated ' + type.charAt(0).toUpperCase() + type.slice(1) + 's.yml';
        const migratedFile = {
            id: `file_migrated_${Date.now()}`,
            fileName: legacyFileName,
            relativePath: this.getRelativePath(type, legacyFileName),
            entries: [...collection],
            _importMeta: {
                migratedAt: new Date().toISOString(),
                wasLegacy: true
            }
        };
        
        // Replace collection with file-based structure
        this.activePack[type + 's'] = [migratedFile];
        this.savePacks();
        
        console.log(`✅ Migrated ${collection.length} ${type}s to file-based structure`);
    }
    
    /**
     * Render a YAML file container with its entries
     */
    renderYamlFile(file, type, fileStates) {
        const isExpanded = fileStates[file.id] || false;
        const entryCount = file.entries?.length || 0;
        const isPlaceholder = file._importMeta?.isPlaceholderFile;
        
        return `
            <div class="yaml-file-container" data-file-id="${file.id}" data-file-type="${type}">
                <div class="yaml-file-header ${isPlaceholder ? 'placeholder-file' : ''}" data-file-id="${file.id}">
                    <i class="fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} file-chevron"></i>
                    <i class="fas fa-file-code yaml-file-icon"></i>
                    <span class="yaml-file-name">${file.fileName}</span>
                    <span class="badge entry-count">${entryCount}</span>
                </div>
                <div class="yaml-file-entries ${isExpanded ? 'expanded' : 'collapsed'}">
                    ${(file.entries || []).map(entry => this.renderEntryItem(entry, type, file.id)).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render an entry item within a file
     */
    renderEntryItem(entry, type, parentFileId) {
        const icons = {
            mob: 'fa-skull',
            skill: 'fa-magic',
            item: 'fa-gem',
            droptable: 'fa-table',
            randomspawn: 'fa-map-marked-alt',
            asset: 'fa-cube'
        };
        
        const isActive = this.editor.state.currentFile && this.editor.state.currentFile.id === entry.id;
        const displayName = entry.internalName || entry.name || 'Unnamed';
        const isPlaceholder = entry._placeholder;
        const isFavorited = this.isFavorited(entry.id);
        
        return `
            <div class="entry-item ${isActive ? 'active' : ''} ${isPlaceholder ? 'placeholder-entry' : ''}" 
                 data-entry-id="${entry.id}" 
                 data-file-type="${type}"
                 data-file-name="${displayName}"
                 data-parent-file-id="${parentFileId}">
                <i class="fas ${icons[type]} entry-icon"></i>
                <span>${displayName}</span>
                ${isPlaceholder ? '<span class="placeholder-badge">placeholder</span>' : ''}
                <button class="favorite-star-btn ${isFavorited ? 'favorited' : ''}" 
                        data-entry-id="${entry.id}"
                        data-file-name="${displayName}"
                        data-file-type="${type}"
                        title="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
                    <i class="fas fa-star"></i>
                </button>
            </div>
        `;
    }
    
    renderFileItem(file, type) {
        const icons = {
            mob: 'fa-skull',
            skill: 'fa-magic',
            item: 'fa-gem',
            droptable: 'fa-table',
            randomspawn: 'fa-map-marked-alt',
            asset: 'fa-cube'
        };
        
        const isActive = this.editor.state.currentFile && this.editor.state.currentFile.id === file.id;
        const displayName = file.internalName || file.name || 'Unnamed';
        
        return `
            <div class="file-item ${isActive ? 'active' : ''}" data-file-id="${file.id}" data-file-type="${type}">
                <i class="fas ${icons[type]} file-icon"></i>
                <span>${displayName}</span>
            </div>
        `;
    }
    
    attachPackEventListeners() {
        // Pack header clicks (toggle collapse or activate)
        document.querySelectorAll('.pack-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (e.target.closest('.pack-actions')) return;
                
                const packId = header.dataset.packId;
                const pack = this.packs.find(p => p.id === packId);
                
                if (this.activePack && this.activePack.id === packId) {
                    // Same pack - toggle collapse
                    this.togglePackCollapse(packId);
                } else if (pack) {
                    // Different pack - activate and expand
                    this.setActivePack(pack);
                    this.saveCollapsedState(packId, false);
                    this.renderPackTree();
                }
            });
            
            // Double-click on pack title to rename inline
            const packTitle = header.querySelector('.pack-title span');
            if (packTitle) {
                packTitle.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const packId = header.dataset.packId;
                    this.startInlineEdit(packTitle, 'pack', { packId });
                });
            }
        });
        
        // Pack settings (cog) button clicks
        document.querySelectorAll('.pack-settings').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const packId = btn.dataset.packId;
                this.togglePackDropdown(packId);
            });
        });
        
        // Dropdown item clicks
        document.querySelectorAll('.pack-dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.dataset.action;
                const packId = item.dataset.packId;
                
                this.closeAllDropdowns();
                
                switch (action) {
                    case 'rename':
                        this.renamePack(packId);
                        break;
                    case 'duplicate':
                        this.duplicatePack(packId);
                        break;
                    case 'export':
                        this.exportPack(packId);
                        break;
                    case 'delete':
                        this.deletePack(packId);
                        break;
                }
            });
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.pack-dropdown') && !e.target.closest('.pack-settings')) {
                this.closeAllDropdowns();
            }
        });
        
        // Prevent yaml-file-container clicks from bubbling to folder headers
        document.querySelectorAll('.yaml-file-container').forEach(container => {
            container.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
        
        // YAML file header clicks (expand/collapse entries)
        document.querySelectorAll('.yaml-file-header').forEach(header => {
            header.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const fileId = header.dataset.fileId;
                this.toggleYamlFile(fileId);
            });
            
            // Double-click on file name to rename inline
            const fileNameSpan = header.querySelector('.yaml-file-name');
            if (fileNameSpan) {
                fileNameSpan.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const fileId = header.dataset.fileId;
                    const fileType = header.closest('.yaml-file-container').dataset.fileType;
                    this.startInlineEdit(fileNameSpan, 'file', { fileId, fileType });
                });
            }
        });
        
        // Entry item clicks (individual entries within YAML files)
        document.querySelectorAll('.entry-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const entryId = item.dataset.entryId;
                const fileType = item.dataset.fileType;
                const parentFileId = item.dataset.parentFileId;
                
                // Try to find entry in active pack first
                let entry = this.findEntryById(entryId, fileType, parentFileId);
                
                // If not found in active pack, search all packs and auto-switch
                if (!entry) {
                    const result = this.findEntryInAllPacks(entryId, fileType, parentFileId);
                    if (result) {
                        // Auto-switch to the pack containing this entry
                        this.setActivePack(result.pack);
                        entry = result.entry;
                    }
                }
                
                if (entry) {
                    this.editor.openFile(entry, fileType);
                }
            });
            
            // Double-click to rename entry inline
            item.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const entryId = item.dataset.entryId;
                const fileType = item.dataset.fileType;
                const parentFileId = item.dataset.parentFileId;
                this.startInlineEdit(item, 'entry', { entryId, fileType, parentFileId });
            });
        });
        
        // Legacy file clicks (for backward compatibility with flat structure)
        document.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', () => {
                const fileId = item.dataset.fileId;
                const fileType = item.dataset.fileType;
                
                // Handle config files specially
                if (fileType === 'packinfo') {
                    this.openPackInfo();
                    return;
                }
                if (fileType === 'tooltips') {
                    this.openTooltips();
                    return;
                }
                
                // Try to find file in active pack first
                let file = this.findFile(fileId, fileType);
                
                // If not found in active pack, search all packs and auto-switch
                if (!file) {
                    const result = this.findFileInAllPacks(fileId, fileType);
                    if (result) {
                        // Auto-switch to the pack containing this file
                        this.setActivePack(result.pack);
                        file = result.file;
                    }
                }
                
                if (file) {
                    this.editor.openFile(file, fileType);
                }
            });
        });
        
        // Add item buttons
        document.querySelectorAll('.add-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                const packId = btn.dataset.packId;
                
                // Auto-switch to the pack where the button was clicked
                if (packId) {
                    const targetPack = this.getPackById(packId);
                    if (targetPack && targetPack !== this.activePack) {
                        this.setActivePack(targetPack);
                    }
                }
                
                switch (type) {
                    case 'mob':
                        this.editor.createNewMob();
                        break;
                    case 'skill':
                        this.editor.createNewSkill();
                        break;
                    case 'item':
                        this.editor.createNewItem();
                        break;
                    case 'droptable':
                        this.editor.createNewDropTable();
                        break;
                    case 'randomspawn':
                        this.editor.createNewRandomSpawn();
                        break;
                }
            });
        });
        
        // Folder collapse/expand
        document.querySelectorAll('.folder-header.collapsible').forEach(header => {
            header.addEventListener('click', (e) => {
                // Only toggle if click is directly on the folder-header or its direct children
                // Don't toggle if click bubbled up from deeper elements
                const clickedElement = e.target;
                const isDirectChild = clickedElement === header || clickedElement.parentElement === header;
                
                if (!isDirectChild) {
                    return;
                }
                
                e.stopPropagation();
                this.toggleFolder(header);
            });
        });
        
        // Pack drag and drop
        this.attachPackDragListeners();
        
        // Context menu for entries and files
        document.querySelectorAll('.entry-item, .yaml-file-header').forEach(item => {
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const fileId = item.dataset.entryId || item.dataset.fileId;
                const fileType = item.dataset.fileType;
                const fileName = item.dataset.fileName || item.querySelector('.yaml-file-name, span')?.textContent || 'Unknown';
                
                if (!this.contextMenu) return;
                
                const isFavorited = this.isFavorited(fileId);
                
                const menuItems = [
                    { label: 'Open', icon: 'fa-folder-open', action: 'open' },
                    { label: 'Duplicate', icon: 'fa-copy', action: 'duplicate' },
                    { separator: true },
                    { label: isFavorited ? 'Remove from Favorites' : 'Add to Favorites', icon: 'fa-star', action: 'toggleFavorite' },
                    { separator: true },
                    { label: 'Copy Name', icon: 'fa-clipboard', action: 'copyName' },
                    { label: 'Export', icon: 'fa-file-export', action: 'export' },
                    { separator: true },
                    { label: 'Delete', icon: 'fa-trash', action: 'delete', danger: true }
                ];
                
                this.contextMenu.show(e.clientX, e.clientY, menuItems, {
                    fileId,
                    fileType,
                    fileName,
                    packName: this.activePack?.name || 'Unknown'
                });
            });
        });
        
        // Favorite star buttons
        document.querySelectorAll('.favorite-star-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                const fileId = btn.dataset.entryId;
                const fileName = btn.dataset.fileName;
                const fileType = btn.dataset.fileType;
                const packName = this.activePack?.name || 'Unknown';
                
                this.toggleFavorite(fileId, fileName, fileType, packName);
            });
        });
    }
    
    toggleFolder(header) {
        const folderItem = header.closest('.folder-item');
        const folderFiles = folderItem.querySelector('.folder-files');
        const chevron = header.querySelector('.folder-chevron');
        const folderName = folderItem.dataset.folderName;
        
        if (folderFiles && chevron) {
            const isCollapsed = folderFiles.classList.contains('collapsed');
            
            if (isCollapsed) {
                folderFiles.classList.remove('collapsed');
                chevron.classList.remove('fa-chevron-right');
                chevron.classList.add('fa-chevron-down');
            } else {
                folderFiles.classList.add('collapsed');
                chevron.classList.remove('fa-chevron-down');
                chevron.classList.add('fa-chevron-right');
            }
            
            // Save state
            this.saveFolderState(folderName, !isCollapsed);
        }
    }
    
    saveFolderState(folderName, isExpanded) {
        const states = this.getFolderStates();
        states[folderName] = isExpanded;
        localStorage.setItem('folderStates', JSON.stringify(states));
    }
    
    getFolderStates() {
        const saved = localStorage.getItem('folderStates');
        // Return empty object - folders are collapsed by default (no state = collapsed)
        return saved ? JSON.parse(saved) : {};
    }
    
    /**
     * Get file expand/collapse states
     */
    getFileStates() {
        const saved = localStorage.getItem('yamlFileStates');
        return saved ? JSON.parse(saved) : {};
    }
    
    /**
     * Start inline editing for a tree item
     */
    startInlineEdit(element, type, data) {
        // Don't start editing if already editing
        if (element.querySelector('input.inline-edit')) return;
        
        const currentText = element.textContent.trim();
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'inline-edit';
        input.value = currentText;
        
        // Store original content
        const originalContent = element.innerHTML;
        
        // Replace content with input
        element.innerHTML = '';
        element.appendChild(input);
        input.focus();
        input.select();
        
        // Save on Enter or blur
        const save = async () => {
            const newName = input.value.trim();
            if (newName && newName !== currentText) {
                const success = await this.performInlineRename(type, data, newName);
                if (success) {
                    element.textContent = newName;
                } else {
                    element.innerHTML = originalContent;
                }
            } else {
                element.innerHTML = originalContent;
            }
        };
        
        // Cancel on Escape
        const cancel = () => {
            element.innerHTML = originalContent;
        };
        
        input.addEventListener('blur', save);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
            }
        });
        
        // Prevent clicks from closing the input
        input.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    /**
     * Perform the actual rename operation
     */
    async performInlineRename(type, data, newName) {
        try {
            // Sanitize the name
            newName = this.editor.sanitizeInternalName(newName);
            
            if (type === 'pack') {
                const pack = this.getPackById(data.packId);
                if (!pack) return false;
                
                pack.name = newName;
                if (pack.packinfo) {
                    pack.packinfo.Name = newName;
                }
                
                await this.savePacks();
                this.renderPackTree();
                this.editor.showToast(`Renamed pack to "${newName}"`, 'success');
                return true;
                
            } else if (type === 'file') {
                const file = this.findFileById(data.fileId, data.fileType);
                if (!file) return false;
                
                // Update file name
                file.fileName = newName.endsWith('.yml') ? newName : newName + '.yml';
                file.relativePath = this.getRelativePath(data.fileType, file.fileName);
                
                await this.savePacks();
                this.renderPackTree();
                this.editor.showToast(`Renamed file to "${file.fileName}"`, 'success');
                this.editor.markDirty();
                return true;
                
            } else if (type === 'entry') {
                const entry = this.findEntryById(data.entryId, data.fileType, data.parentFileId);
                if (!entry) return false;
                
                // Check for duplicates in the same file
                const parentFile = this.findFileById(data.parentFileId, data.fileType);
                if (parentFile && parentFile.entries) {
                    const duplicate = parentFile.entries.find(e => 
                        e.id !== entry.id && 
                        (e.name === newName || e.internalName === newName)
                    );
                    if (duplicate) {
                        this.editor.showToast('An entry with that name already exists in this file', 'error');
                        return false;
                    }
                }
                
                // Update entry name
                const oldName = entry.name || entry.internalName;
                if (entry.name !== undefined) entry.name = newName;
                if (entry.internalName !== undefined) entry.internalName = newName;
                
                await this.savePacks();
                this.renderPackTree();
                this.editor.showToast(`Renamed "${oldName}" to "${newName}"`, 'success');
                this.editor.markDirty();
                
                // If this entry is currently open, update the editor
                if (this.editor.state.currentFile && this.editor.state.currentFile.id === entry.id) {
                    this.editor.state.currentFile = entry;
                    this.editor.updateCurrentEditor();
                }
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Failed to rename:', error);
            this.editor.showToast('Failed to rename: ' + error.message, 'error');
            return false;
        }
    }
    
    /**
     * Find a file by ID
     */
    findFileById(fileId, fileType) {
        if (!this.activePack) return null;
        const collection = this.activePack[fileType + 's'];
        if (!collection) return null;
        return collection.find(f => f.id === fileId);
    }
    
    /**
     * Save file expand/collapse state
     */
    saveFileState(fileId, isExpanded) {
        const states = this.getFileStates();
        states[fileId] = isExpanded;
        localStorage.setItem('yamlFileStates', JSON.stringify(states));
    }
    
    /**
     * Toggle YAML file expand/collapse
     */
    toggleYamlFile(fileId) {
        const states = this.getFileStates();
        const wasExpanded = states[fileId];
        const isNowExpanded = !wasExpanded;
        states[fileId] = isNowExpanded;
        this.saveFileState(fileId, isNowExpanded);
        
        // Update just this file's UI instead of re-rendering entire tree
        const fileContainer = document.querySelector(`.yaml-file-container[data-file-id="${fileId}"]`);
        if (fileContainer) {
            const fileHeader = fileContainer.querySelector('.yaml-file-header');
            const fileEntries = fileContainer.querySelector('.yaml-file-entries');
            const chevron = fileHeader?.querySelector('.file-chevron');
            
            if (fileEntries && chevron) {
                if (isNowExpanded) {
                    fileEntries.classList.remove('collapsed');
                    fileEntries.classList.add('expanded');
                    chevron.classList.remove('fa-chevron-right');
                    chevron.classList.add('fa-chevron-down');
                } else {
                    fileEntries.classList.remove('expanded');
                    fileEntries.classList.add('collapsed');
                    chevron.classList.remove('fa-chevron-down');
                    chevron.classList.add('fa-chevron-right');
                }
            }
        }
        
        // If expanding the file, also set it as the active file context for adding new sections
        if (isNowExpanded) {
            this.setActiveFileContext(fileId);
        }
    }
    
    /**
     * Update a single file container's entry list without re-rendering the entire tree
     */
    updateFileContainer(fileId, type) {
        // Save the packs to ensure the data is persisted
        this.savePacks();
        
        const fileContainer = document.querySelector(`.yaml-file-container[data-file-id="${fileId}"]`);
        if (!fileContainer) {
            // File container doesn't exist yet, need full render
            this.renderPackTree();
            return;
        }
        
        // Ensure the file is expanded
        const fileStates = this.getFileStates();
        if (!fileStates[fileId]) {
            fileStates[fileId] = true;
            this.saveFileState(fileId, true);
            
            // Update the visual state
            const fileHeader = fileContainer.querySelector('.yaml-file-header');
            const fileEntries = fileContainer.querySelector('.yaml-file-entries');
            const chevron = fileHeader?.querySelector('.file-chevron');
            
            if (fileEntries && chevron) {
                fileEntries.classList.remove('collapsed');
                fileEntries.classList.add('expanded');
                chevron.classList.remove('fa-chevron-right');
                chevron.classList.add('fa-chevron-down');
            }
        }
        
        // Find the file data
        const collection = this.activePack[type + 's'];
        const file = collection?.find(f => f.id === fileId);
        if (!file) return;
        
        // Update entry count badge
        const badge = fileContainer.querySelector('.badge.entry-count');
        if (badge) {
            badge.textContent = file.entries?.length || 0;
        }
        
        // Update entries list
        const entriesContainer = fileContainer.querySelector('.yaml-file-entries');
        if (entriesContainer && file.entries) {
            entriesContainer.innerHTML = file.entries.map(entry => 
                this.renderEntryItem(entry, type, fileId)
            ).join('');
            
            // Re-attach event listeners for new entries
            entriesContainer.querySelectorAll('.entry-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const entryId = item.dataset.entryId;
                    const fileType = item.dataset.fileType;
                    const parentFileId = item.dataset.parentFileId;
                    
                    const entry = this.findEntryById(entryId, fileType, parentFileId);
                    if (entry) {
                        this.editor.openFile(entry, fileType);
                    }
                });
            });
            
            // Update active highlighting
            this.updateActiveFileInTree();
        }
        
        // Update folder-level badge counter
        this.updateFolderBadge(type + 's');
    }
    
    /**
     * Update the folder-level badge counter for a specific collection
     */
    updateFolderBadge(folderName) {
        if (!this.activePack) return;
        
        const collection = this.activePack[folderName];
        if (!collection) return;
        
        // Calculate total entries across all files
        const totalEntries = collection.reduce((sum, file) => sum + (file.entries?.length || 0), 0);
        
        // Special case for assets (no entries, just file count)
        const badgeCount = folderName === 'assets' ? (collection.length || 0) : totalEntries;
        
        // Find and update the badge
        const folderHeader = document.querySelector(`.folder-header[data-folder="${folderName}"]`);
        if (folderHeader) {
            const badge = folderHeader.querySelector('.badge');
            if (badge) {
                badge.textContent = badgeCount;
            }
        }
    }
    
    /**
     * Set a YAML file as the active context for adding new sections
     */
    setActiveFileContext(fileId) {
        // Find the file across all collections
        const pack = this.activePack;
        if (!pack) return;
        
        const collections = ['mobs', 'skills', 'items', 'droptables', 'randomspawns'];
        
        for (const collectionName of collections) {
            const collection = pack[collectionName];
            if (!collection) continue;
            
            const file = collection.find(f => f.id === fileId);
            if (file) {
                // Determine the type from collection name
                const type = collectionName.slice(0, -1); // Remove 's' from end
                
                // Create a virtual "file container" entry to represent the selected file
                const fileContainer = {
                    id: `container_${fileId}`,
                    _isFileContainer: true,
                    _fileId: fileId,
                    _fileName: file.fileName,
                    _file: file,
                    name: file.fileName,
                    fileName: file.fileName
                };
                
                // Open this as the current file
                this.editor.openFile(fileContainer, type);
                return;
            }
        }
    }
    
    updateActiveFileInTree() {
        // Remove active class from all files, entries, and yaml file headers
        document.querySelectorAll('.file-item, .entry-item, .yaml-file-header').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to current file/entry
        if (this.editor.state.currentFile && this.editor.state.currentFile.id) {
            // Check if it's a file container
            if (this.editor.state.currentFile._isFileContainer) {
                const activeFileHeader = document.querySelector(`.yaml-file-header[data-file-id="${this.editor.state.currentFile._fileId}"]`);
                if (activeFileHeader) {
                    activeFileHeader.classList.add('active');
                    return;
                }
            }
            
            // Try to find in entry items first (file-based structure)
            const activeEntry = document.querySelector(`.entry-item[data-entry-id="${this.editor.state.currentFile.id}"]`);
            if (activeEntry) {
                activeEntry.classList.add('active');
                
                // Also highlight the parent file header
                const parentFileId = activeEntry.dataset.parentFileId;
                if (parentFileId) {
                    const parentFileHeader = document.querySelector(`.yaml-file-header[data-file-id="${parentFileId}"]`);
                    if (parentFileHeader) {
                        parentFileHeader.classList.add('active');
                    }
                }
                return;
            }
            
            // Fallback to legacy file items
            const activeItem = document.querySelector(`.file-item[data-file-id="${this.editor.state.currentFile.id}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        }
    }
    
    openPackInfo() {
        if (!this.activePack) return;
        
        // Open packinfo.yml editor using the standard view system
        this.editor.openFile({ type: 'packinfo', data: this.activePack.packinfo }, 'packinfo');
    }
    
    openTooltips() {
        this.editor.showToast('Tooltips.yml is not a standard MythicMobs file - reserved for future use', 'info');
    }
    
    renderPackInfoEditor() {
        const editorView = document.getElementById('packinfo-editor-view');
        if (!editorView) return;
        
        const packinfo = this.activePack.packinfo;
        
        editorView.innerHTML = `
            <div class="editor-header">
                <h2>
                    <i class="fas fa-info-circle"></i>
                    Pack Information
                    <span class="item-name">${packinfo.Name}</span>
                </h2>
                <div class="editor-actions">
                    <button class="btn btn-primary" id="save-packinfo">
                        <i class="fas fa-save"></i> Save
                    </button>
                </div>
            </div>
            <div class="editor-content">
            <div class="card" style="max-width: 800px; margin: 0 auto;">
                <div style="padding: var(--spacing-lg);">
                    <p style="margin: 0 0 var(--spacing-lg) 0; color: var(--text-secondary); font-size: 0.875rem;">Configure pack metadata for MythicMobs menu display</p>
                
                <div style="padding: var(--spacing-lg);">
                    <div class="form-group">
                        <label class="form-label">Pack Name <span class="required">*</span></label>
                        <input type="text" class="form-input" id="packinfo-name" value="${packinfo.Name}" placeholder="The name of the pack">
                    </div>
                    
                    <div class="input-group">
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label">Version <span class="required">*</span></label>
                            <input type="text" class="form-input" id="packinfo-version" value="${packinfo.Version}" placeholder="0.1.0">
                        </div>
                        
                        <div class="form-group" style="flex: 2;">
                            <label class="form-label">Author <span class="required">*</span></label>
                            <input type="text" class="form-input" id="packinfo-author" value="${packinfo.Author}" placeholder="The name of the author">
                        </div>
                    </div>
                    
                    <div class="form-group" style="position: relative;">
                        <label class="form-label">Icon Material <span class="required">*</span></label>
                        <div id="packinfo-material-dropdown" class="packinfo-material-dropdown"></div>
                        <span class="form-hint">The Bukkit material name (e.g., DIAMOND_SWORD, EMERALD)</span>
                    </div>
                    
                    <div style="margin-top: var(--spacing-lg); padding-top: var(--spacing-lg); border-top: 1px solid var(--border-primary);">
                        <h3 style="margin: 0 0 var(--spacing-md) 0; color: var(--text-secondary); font-size: 0.875rem; display: flex; align-items: center; gap: var(--spacing-sm);">
                            <i class="fas fa-sliders-h" style="color: var(--text-muted);"></i>
                            Optional Settings
                        </h3>
                        
                        <div class="form-group">
                            <label class="form-label">CustomModelData</label>
                            <input type="text" class="form-input" id="packinfo-icon-model" value="${packinfo.Icon?.Model || ''}" placeholder="Leave empty if not using">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">URL</label>
                            <input type="text" class="form-input" id="packinfo-url" value="${packinfo.URL || ''}" placeholder="https://yoursite.com">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea class="form-textarea" id="packinfo-description" rows="4" placeholder="One line per entry">${packinfo.Description?.join('\n') || ''}</textarea>
                            <span class="form-hint">Use & for color codes (e.g., &a for green)</span>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        `;
        
        // Initialize material dropdown with items
        const materialItems = (typeof MINECRAFT_ITEMS !== 'undefined' ? MINECRAFT_ITEMS : []).map(item => item.toUpperCase());
        window.packinfoMaterialDropdown = new SearchableDropdown('packinfo-material-dropdown', {
            categories: window.getCombinedItemCategories ? window.getCombinedItemCategories(true) : (window.MINECRAFT_ITEM_CATEGORIES || null),
            items: !window.getCombinedItemCategories && !window.MINECRAFT_ITEM_CATEGORIES ? materialItems : null,
            useIcons: true,
            storageKey: 'packinfo-material',
            placeholder: 'Search materials...',
            value: packinfo.Icon?.Material || '',
            onSelect: (value) => {
                this.syncPackInfoToFile();
                this.editor.markDirty();
            }
        });
        
        // Attach save handler
        document.getElementById('save-packinfo')?.addEventListener('click', () => {
            this.savePackInfo();
        });
        
        // Attach input change listeners for live preview
        const inputs = document.querySelectorAll('#packinfo-name, #packinfo-version, #packinfo-author, #packinfo-icon-model, #packinfo-url, #packinfo-description');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.syncPackInfoToFile();
                this.editor.markDirty();
            });
        });
        
        // Update YAML preview
        this.updatePackInfoPreview();
        this.editor.updateYAMLPreview();
    }
    
    syncPackInfoToFile() {
        // Sync form data to state.currentFile for live YAML preview
        if (!this.editor.state.currentFile) return;
        
        // Get material from dropdown
        const materialValue = window.packinfoMaterialDropdown?.getValue() || '';
        const modelValue = document.getElementById('packinfo-icon-model')?.value?.trim() || '';
        const urlValue = document.getElementById('packinfo-url')?.value?.trim() || '';
        const descriptionLines = document.getElementById('packinfo-description')?.value.split('\n').filter(line => line.trim()) || [];
        
        const packinfo = {
            Name: document.getElementById('packinfo-name')?.value || '',
            Version: document.getElementById('packinfo-version')?.value || '',
            Author: document.getElementById('packinfo-author')?.value || ''
        };
        
        // Only add Icon if Material is set
        if (materialValue) {
            packinfo.Icon = { Material: materialValue };
            // Only add Model if it has a value
            if (modelValue) {
                packinfo.Icon.Model = modelValue;
            }
        }
        
        // Only add optional fields if they have values
        if (urlValue) {
            packinfo.URL = urlValue;
        }
        
        if (descriptionLines.length > 0) {
            packinfo.Description = descriptionLines;
        }
        
        // Update the current file data
        if (this.editor.state.currentFile.data) {
            Object.assign(this.editor.state.currentFile.data, packinfo);
        } else {
            this.editor.state.currentFile.data = packinfo;
        }
    }
    
    savePackInfo() {
        // Get material from dropdown
        const materialValue = window.packinfoMaterialDropdown?.getValue() || '';
        const modelValue = document.getElementById('packinfo-icon-model')?.value?.trim() || '';
        const urlValue = document.getElementById('packinfo-url')?.value?.trim() || '';
        const descriptionLines = document.getElementById('packinfo-description')?.value.split('\n').filter(line => line.trim()) || [];
        
        const packinfo = {
            Name: document.getElementById('packinfo-name').value,
            Version: document.getElementById('packinfo-version').value,
            Author: document.getElementById('packinfo-author').value
        };
        
        // Only add Icon if Material is set
        if (materialValue) {
            packinfo.Icon = { Material: materialValue };
            if (modelValue) {
                packinfo.Icon.Model = modelValue;
            }
        }
        
        // Only add optional fields if they have values
        if (urlValue) {
            packinfo.URL = urlValue;
        }
        
        if (descriptionLines.length > 0) {
            packinfo.Description = descriptionLines;
        }
        
        this.activePack.packinfo = packinfo;
        this.activePack.name = packinfo.Name; // Update pack name too
        this.savePacks();
        this.renderPackTree();
        this.editor.updateYAMLPreview();
        this.editor.state.isDirty = false;
        this.editor.updateSaveStatusIndicator();
        this.editor.showToast('Saved successfully', 'success');
    }
    
    updatePackInfoPreview() {
        // No longer needed - handled by editor.updateYAMLPreview() via markDirty()
    }
    
    /**
     * Find a file in all packs (not just active pack)
     * Returns { file, pack } or null
     */
    findFileInAllPacks(fileId, fileType) {
        for (const pack of this.packs) {
            const collection = pack[fileType + 's'];
            if (collection && collection.length > 0) {
                const file = collection.find(f => f.id === fileId);
                if (file) {
                    return { file, pack };
                }
            }
        }
        return null;
    }

    findFile(fileId, fileType) {
        if (!this.activePack) return null;
        
        const collection = this.activePack[fileType + 's'];
        if (!collection || collection.length === 0) return null;
        
        // Always use file-based structure - find file container by ID
        return collection.find(f => f.id === fileId);
    }
    
    /**
     * Find an entry in all packs (not just active pack)
     * Returns { entry, pack } or null
     */
    findEntryInAllPacks(entryId, fileType, parentFileId) {
        for (const pack of this.packs) {
            const collection = pack[fileType + 's'];
            if (!collection || collection.length === 0) continue;
            
            if (parentFileId) {
                const parentFile = collection.find(f => f.id === parentFileId);
                if (parentFile && parentFile.entries) {
                    const entry = parentFile.entries.find(e => e.id === entryId);
                    if (entry) {
                        // Attach parent file reference for context
                        entry._parentFile = { id: parentFile.id, fileName: parentFile.fileName };
                        return { entry, pack };
                    }
                }
            }
        }
        return null;
    }

    /**
     * Find an entry by its ID within the file-based structure
     */
    findEntryById(entryId, fileType, parentFileId) {
        if (!this.activePack) return null;
        
        const collection = this.activePack[fileType + 's'];
        if (!collection || collection.length === 0) return null;
        
        // Find the parent file first if provided
        if (parentFileId) {
            const parentFile = collection.find(f => f.id === parentFileId);
            if (parentFile && parentFile.entries) {
                const entry = parentFile.entries.find(e => e.id === entryId);
                if (entry) {
                    // Attach parent file reference for context
                    entry._parentFile = { id: parentFile.id, fileName: parentFile.fileName };
                    return entry;
                }
            }
        }
        
        // Search all files
        for (const file of collection) {
            if (!file.entries) continue;
            const entry = file.entries.find(e => e.id === entryId);
            if (entry) {
                entry._parentFile = { id: file.id, fileName: file.fileName };
                return entry;
            }
        }
        
        return null;
    }
    
    /**
     * Find entry across all files in a collection
     */
    findEntryByName(name, fileType) {
        if (!this.activePack) return null;
        
        const collection = this.activePack[fileType + 's'];
        if (!collection || collection.length === 0) return null;
        
        // Search all files for the entry
        for (const file of collection) {
            if (!file.entries) continue;
            const entry = file.entries.find(e => 
                e.name === name || e.internalName === name
            );
            if (entry) {
                entry._parentFile = { id: file.id, fileName: file.fileName };
                return entry;
            }
        }
        
        return null;
    }

    addFile(file, type, fileName = null, shouldExpand = true) {
        if (!this.activePack) return false;
        
        const collection = this.activePack[type + 's'];
        if (!collection) return false;
        
        // Always use file-based structure
        // Use provided fileName or generate unique one
        const baseFileName = fileName || ('New ' + type.charAt(0).toUpperCase() + type.slice(1) + 's');
        const uniqueFileName = fileName || this.generateUniqueFileName(collection, baseFileName, type);
        
        // Find or create the file
        let targetFile = collection.find(f => f.fileName === uniqueFileName);
        const isNewFile = !targetFile;
        
        if (!targetFile) {
            targetFile = {
                id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                fileName: uniqueFileName,
                relativePath: this.getRelativePath(type, uniqueFileName),
                entries: [],
                _importMeta: {
                    createdAt: new Date().toISOString()
                }
            };
            collection.push(targetFile);
            
            // Only expand folder and file if explicitly requested
            if (shouldExpand) {
                const folderName = type + 's';
                this.saveFolderState(folderName, true);
                this.saveFileState(targetFile.id, true);
            }
        }
        
        targetFile.entries.push(file);
        
        this.savePacks();
        
        // Only full re-render if we created a new file, otherwise just update the specific file container
        if (isNewFile) {
            this.renderPackTree();
        } else {
            this.updateFileContainer(targetFile.id, type);
        }
        
        return targetFile;
    }
    
    /**
     * Generate a unique file name by adding numbers or random suffix
     */
    generateUniqueFileName(collection, baseName, type) {
        let fileName = `${baseName}.yml`;
        let counter = 1;
        
        // Check if base name already exists
        while (collection.some(f => f.fileName === fileName)) {
            fileName = `${baseName}_${counter}.yml`;
            counter++;
        }
        
        return fileName;
    }
    
    /**
     * Check if a file name already exists in collection
     */
    fileNameExists(collection, fileName) {
        return collection.some(f => f.fileName === fileName);
    }
    
    /**
     * Add entry to a specific file
     */
    addEntryToFile(entry, type, fileId) {
        if (!this.activePack) return false;
        
        const collection = this.activePack[type + 's'];
        if (!collection) return false;
        
        const file = collection.find(f => f.id === fileId);
        if (file && file.entries) {
            file.entries.push(entry);
            this.savePacks();
            this.renderPackTree();
            return true;
        }
        
        return false;
    }
    
    /**
     * Create an empty file without any entries
     */
    createEmptyFile(type, fileName) {
        if (!this.activePack) return false;
        
        const collection = this.activePack[type + 's'];
        if (!collection) return false;
        
        // Ensure unique file name
        const uniqueFileName = this.generateUniqueFileName(collection, fileName.replace('.yml', ''), type);
        
        // Check if file already exists
        if (this.fileNameExists(collection, uniqueFileName)) {
            this.editor.showToast(`File "${uniqueFileName}" already exists`, 'warning');
            return false;
        }
        
        // Create empty file
        const newFile = {
            id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fileName: uniqueFileName,
            relativePath: this.getRelativePath(type, uniqueFileName),
            entries: [],
            _importMeta: {
                createdAt: new Date().toISOString()
            }
        };
        
        collection.push(newFile);
        
        // Expand folder to show the new file
        const folderName = type + 's';
        this.saveFolderState(folderName, true);
        this.saveFileState(newFile.id, false); // Don't auto-expand the file itself
        
        this.savePacks();
        this.renderPackTree();
        return true;
    }
    
    /**
     * Create a new YAML file container
     */
    async createYamlFile(fileName, type) {
        if (!this.activePack) return null;
        
        const collection = this.activePack[type + 's'];
        if (!collection) return null;
        
        // Check if file with this name already exists
        const fileExists = collection.some(f => f.fileName === fileName);
        if (fileExists) {
            // Check if warnings are enabled in settings
            const warnDuplicates = this.editor.settings.warnDuplicateFiles !== false;
            
            if (warnDuplicates) {
                const proceed = await this.editor.showConfirmDialog(
                    'Duplicate File Name',
                    `A file named "${fileName}" already exists. Do you want to create it anyway?`,
                    'Create Anyway',
                    'Cancel'
                );
                
                if (!proceed) {
                    return null; // User cancelled
                }
            }
        }
        
        const newFile = {
            id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fileName: fileName,
            relativePath: this.getRelativePath(type, fileName),
            entries: [],
            _importMeta: {
                createdAt: new Date().toISOString()
            }
        };
        
        collection.push(newFile);
        this.savePacks();
        this.renderPackTree();
        return newFile;
    }
    
    /**
     * Get relative path for a file type
     */
    getRelativePath(type, fileName) {
        const folders = {
            mob: 'Mobs',
            skill: 'Skills',
            item: 'Items',
            droptable: 'DropTables',
            randomspawn: 'RandomSpawns'
        };
        return `${folders[type] || type}/${fileName}`;
    }

    removeFile(fileId, type) {
        if (!this.activePack) return false;
        
        const collection = this.activePack[type + 's'];
        if (!collection || collection.length === 0) return false;
        
        // Remove file container by ID
        const fileIndex = collection.findIndex(f => f.id === fileId);
        if (fileIndex >= 0) {
            collection.splice(fileIndex, 1);
            
            // If the deleted file is currently open, go to dashboard
            if (this.editor.state.currentFile && this.editor.state.currentFile.id === fileId) {
                this.editor.goToDashboard();
            }
            
            this.savePacks();
            this.renderPackTree();
            return true;
        }
        
        return false;
    }
    
    /**
     * Remove an entry from within a file
     */
    removeEntryFromFile(entryId, type, parentFileId) {
        if (!this.activePack) return false;
        
        const collection = this.activePack[type + 's'];
        if (!collection) return false;
        
        const file = collection.find(f => f.id === parentFileId);
        if (file && file.entries) {
            const entryIndex = file.entries.findIndex(e => e.id === entryId);
            if (entryIndex >= 0) {
                file.entries.splice(entryIndex, 1);
                
                // If the deleted entry is currently open, go to dashboard
                if (this.editor.state.currentFile && this.editor.state.currentFile.id === entryId) {
                    this.editor.goToDashboard();
                }
                
                // Optionally remove file if it's empty
                // Uncomment if you want empty files to be auto-removed
                // if (file.entries.length === 0) {
                //     const fileIndex = collection.findIndex(f => f.id === parentFileId);
                //     if (fileIndex >= 0) collection.splice(fileIndex, 1);
                // }
                
                this.savePacks();
                this.renderPackTree();
                return true;
            }
        }
        
        return false;
    }
    
    // Pack collapse management
    togglePackCollapse(packId) {
        const collapsedStates = this.getCollapsedStates();
        collapsedStates[packId] = !collapsedStates[packId];
        this.saveCollapsedState(packId, collapsedStates[packId]);
        this.renderPackTree();
    }
    
    getCollapsedStates() {
        const saved = localStorage.getItem('packCollapsedStates');
        return saved ? JSON.parse(saved) : {};
    }
    
    saveCollapsedState(packId, isCollapsed) {
        const states = this.getCollapsedStates();
        states[packId] = isCollapsed;
        localStorage.setItem('packCollapsedStates', JSON.stringify(states));
    }
    
    // Dropdown management
    togglePackDropdown(packId) {
        if (this.openDropdownPackId === packId) {
            this.closeAllDropdowns();
        } else {
            this.openDropdownPackId = packId;
            this.renderPackTree();
        }
    }
    
    closeAllDropdowns() {
        this.openDropdownPackId = null;
        document.querySelectorAll('.pack-dropdown').forEach(dropdown => {
            dropdown.style.display = 'none';
            dropdown.classList.remove('open');
        });
    }
    
    // Pack actions
    async renamePack(packId) {
        const pack = this.packs.find(p => p.id === packId);
        if (!pack) return;
        
        let newName = null;
        let attempts = 0;
        const funMessages = [
            "Hold up! That name's already taken. Try another one! 🎯",
            "Oops! Name collision detected. Be more creative! 💫",
            "Nope! That pack name exists already. Give it another shot! 🎪",
            "Nice try! But we need a unique name here. 🌟",
            "Duplicate alert! Time for a fresh name! 🎨"
        ];
        
        while (!newName) {
            const inputName = await this.editor.showPrompt('Rename Pack', 'Enter new pack name:', pack.name);
            if (!inputName || inputName.trim() === '') return; // User cancelled
            
            // Check for duplicate names (excluding current pack)
            const exists = this.packs.some(p => p.id !== packId && p.name === inputName.trim());
            if (exists) {
                const message = funMessages[attempts % funMessages.length];
                this.editor.showToast(message, 'warning');
                attempts++;
                continue; // Ask again
            }
            
            newName = inputName.trim();
        }
        
        pack.name = newName;
        this.savePacks();
        this.renderPackTree();
        this.editor.showToast('Pack renamed successfully! ✨', 'success');
    }
    
    duplicatePack(packId) {
        const pack = this.packs.find(p => p.id === packId);
        if (!pack) return;
        
        // Deep clone the pack
        const newPack = typeof structuredClone !== 'undefined' ? structuredClone(pack) : JSON.parse(JSON.stringify(pack));
        newPack.id = Date.now().toString();
        newPack.name = pack.name + ' (Copy)';
        
        // Generate new IDs for all files and their entries
        ['mobs', 'skills', 'items', 'droptables', 'randomspawns', 'assets'].forEach(type => {
            if (newPack[type] && Array.isArray(newPack[type])) {
                newPack[type] = newPack[type].map(file => {
                    const newFile = {
                        ...file,
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
                    };
                    
                    // If file-based structure, also regenerate entry IDs
                    if (newFile.entries && Array.isArray(newFile.entries)) {
                        newFile.entries = newFile.entries.map(entry => ({
                            ...entry,
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
                        }));
                    }
                    
                    return newFile;
                });
            }
        });
        
        this.packs.push(newPack);
        this.savePacks();
        this.renderPackTree();
        this.editor.showToast(`Pack duplicated: ${newPack.name}`, 'success');
    }
    
    async exportPack(packId) {
        const pack = this.packs.find(p => p.id === packId);
        if (!pack) return;
        
        try {
            const JSZip = window.JSZip;
            if (!JSZip) {
                this.editor.showToast('JSZip library not loaded', 'error');
                return;
            }
            
            const zip = new JSZip();
            
            // Helper to export a collection (always file-based structure)
            const exportCollection = (collection, folderName, type) => {
                if (!collection || collection.length === 0) return;
                
                const folder = zip.folder(folderName);
                
                // Set pack context for template-aware mob exports
                if (type === 'mob') {
                    this.editor.yamlExporter.setPackContext(pack);
                }
                
                // File-based structure: export each file with its entries
                collection.forEach(file => {
                    if (!file.entries || file.entries.length === 0) return;
                    
                    // Build YAML content with all entries in the file
                    let yamlContent = '';
                    file.entries.forEach((entry, index) => {
                        const yaml = this.editor.yamlExporter.exportWithoutFooter(entry, type);
                        yamlContent += yaml;
                        if (index < file.entries.length - 1) {
                            yamlContent += '\n';
                        }
                    });
                    
                    // Add footer once at the end of the file
                    yamlContent += '\n#\n#\n#\n#\n#\n#\n#\n#\n#\n#\n#\n# Made by AlternativeSoap\'s MythicMob Editor\n# Discord: https://discord.gg/eUFRvyzJua';
                    
                    folder.file(file.fileName, yamlContent);
                });
            };
            
            // Export all collections
            exportCollection(pack.mobs, 'Mobs', 'mob');
            exportCollection(pack.skills, 'Skills', 'skill');
            exportCollection(pack.items, 'Items', 'item');
            exportCollection(pack.droptables, 'DropTables', 'droptable');
            exportCollection(pack.randomspawns, 'RandomSpawns', 'randomspawn');
            
            // Export packinfo.yml
            const packinfo = pack.packinfo || this.createDefaultPackInfo(pack.name);
            const footer = '\n#\n#\n#\n#\n#\n#\n#\n#\n#\n#\n#\n# Made by AlternativeSoap\'s MythicMob Editor\n# Discord: https://discord.gg/eUFRvyzJua';
            const packinfoYaml = `Name: ${packinfo.Name || pack.name}
Version: ${packinfo.Version || '1.0.0'}
Author: ${packinfo.Author || ''}
Icon:
  Material: ${packinfo.Icon?.Material || 'DIAMOND'}
  Model: ${packinfo.Icon?.Model || 0}
URL: ${packinfo.URL || ''}
Description:
${(packinfo.Description || ['A MythicMobs pack']).map(line => `- ${line}`).join('\n')}` + footer;
            zip.file('packinfo.yml', packinfoYaml);
            
            // Export tooltips.yml
            zip.file('tooltips.yml', '# Tooltips configuration\n' + footer);
            
            // Generate and download
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${pack.name.replace(/[^a-z0-9]/gi, '_')}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.editor.showToast('Pack exported successfully', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.editor.showToast('Failed to export pack', 'error');
        }
    }
    
    async deletePack(packId) {
        const pack = this.packs.find(p => p.id === packId);
        if (!pack) return;
        
        const confirmed = await this.editor.showConfirmDialog(
            'Delete Pack',
            `Are you sure you want to delete '${pack.name}'? This cannot be undone.`,
            'Delete',
            'Cancel'
        );
        
        if (!confirmed) {
            return;
        }
        
        // Check if the deleted pack contains the currently open file
        const currentFileInDeletedPack = this.editor.state.currentFile && 
            this.editor.state.currentFileType &&
            pack[this.editor.state.currentFileType + 's']?.some(f => {
                // Check if it's a file container
                if (f.id === this.editor.state.currentFile.id) return true;
                // Check if it's an entry within a file
                if (f.entries?.some(e => e.id === this.editor.state.currentFile.id)) return true;
                return false;
            });
        
        // Remove pack
        this.packs = this.packs.filter(p => p.id !== packId);
        
        // If it was active or contained the open file, clear and show dashboard
        if ((this.activePack && this.activePack.id === packId) || currentFileInDeletedPack) {
            this.activePack = this.packs[0] || null;
            this.editor.state.currentPack = this.activePack;
            this.editor.goToDashboard();
        }
        
        this.savePacks();
        this.renderPackTree();
        this.editor.showToast('Pack deleted successfully', 'success');
    }
    
    /**
     * Attach drag and drop event listeners for pack reordering
     */
    attachPackDragListeners() {
        const packItems = document.querySelectorAll('.pack-item');
        let draggedElement = null;
        let draggedIndex = null;
        
        packItems.forEach((item, index) => {
            // Dragstart
            item.addEventListener('dragstart', (e) => {
                draggedElement = item;
                draggedIndex = index;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', item.innerHTML);
            });
            
            // Dragend
            item.addEventListener('dragend', (e) => {
                item.classList.remove('dragging');
                // Remove all drag-over classes
                document.querySelectorAll('.pack-item').forEach(p => {
                    p.classList.remove('drag-over-top', 'drag-over-bottom');
                });
            });
            
            // Dragover
            item.addEventListener('dragover', (e) => {
                if (e.preventDefault) {
                    e.preventDefault();
                }
                e.dataTransfer.dropEffect = 'move';
                
                if (item === draggedElement) return;
                
                // Determine if we're in the top or bottom half
                const rect = item.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                
                // Remove previous indicators
                item.classList.remove('drag-over-top', 'drag-over-bottom');
                
                if (e.clientY < midpoint) {
                    item.classList.add('drag-over-top');
                } else {
                    item.classList.add('drag-over-bottom');
                }
                
                return false;
            });
            
            // Dragleave
            item.addEventListener('dragleave', (e) => {
                item.classList.remove('drag-over-top', 'drag-over-bottom');
            });
            
            // Drop
            item.addEventListener('drop', (e) => {
                if (e.stopPropagation) {
                    e.stopPropagation();
                }
                
                if (draggedElement === item) return false;
                
                // Determine drop position
                const rect = item.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                const dropIndex = Array.from(packItems).indexOf(item);
                
                let newIndex;
                if (e.clientY < midpoint) {
                    // Drop above
                    newIndex = dropIndex;
                } else {
                    // Drop below
                    newIndex = dropIndex + 1;
                }
                
                // Adjust if dragging downward
                if (draggedIndex < newIndex) {
                    newIndex--;
                }
                
                // Reorder packs array
                const movedPack = this.packs.splice(draggedIndex, 1)[0];
                this.packs.splice(newIndex, 0, movedPack);
                
                // Save and re-render
                this.savePacks();
                this.renderPackTree();
                this.editor.showToast('Pack order updated', 'success');
                
                return false;
            });
        });
    }
    
    // =================================================================
    // SEARCH & FILTER
    // =================================================================
    
    /**
     * Setup search functionality
     */
    setupSearch() {
        // Only setup once
        if (this._searchSetup) return;
        
        const searchInput = document.getElementById('pack-search-input');
        const clearBtn = document.getElementById('pack-search-clear');
        
        if (!searchInput) {
            // DOM not ready yet, will try again on next render
            return;
        }
        
        // Real-time search
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.trim().toLowerCase();
            
            // Show/hide clear button
            if (clearBtn) {
                if (this.searchQuery) {
                    clearBtn.classList.remove('hidden');
                } else {
                    clearBtn.classList.add('hidden');
                }
            }
            
            this.applySearch();
        });
        
        // Clear search
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                this.searchQuery = '';
                clearBtn.classList.add('hidden');
                this.applySearch();
                searchInput.focus();
            });
        }
        
        // Mark as setup
        this._searchSetup = true;
    }
    
    /**
     * Restore search state after re-render
     */
    restoreSearchState() {
        if (!this.searchQuery) return;
        
        const searchInput = document.getElementById('pack-search-input');
        const clearBtn = document.getElementById('pack-search-clear');
        
        if (searchInput) {
            // Restore input value
            searchInput.value = this.searchQuery;
            
            // Show clear button
            if (clearBtn) {
                clearBtn.classList.remove('hidden');
            }
            
            // Reapply search filter
            this.applySearch();
        }
    }
    
    /**
     * Apply search filter to pack tree
     */
    applySearch() {
        const allItems = document.querySelectorAll('.entry-item, .yaml-file-header');
        
        if (!this.searchQuery) {
            // Show all items
            document.querySelectorAll('.pack-item, .folder-item, .yaml-file-header, .entry-item, .yaml-file-item, .yaml-file-container')
                .forEach(el => el.classList.remove('search-hidden'));
            
            // Remove highlights
            document.querySelectorAll('.search-highlight').forEach(el => {
                const parent = el.parentNode;
                parent.replaceChild(document.createTextNode(el.textContent), el);
            });
            
            return;
        }
        
        // Track matches
        let matchCount = 0;
        const matchedPacks = new Set();
        const matchedYamlFiles = new Set();
        const yamlFilesWithMatchingHeader = new Set();
        
        // First pass: find all matching entries
        allItems.forEach(item => {
            const nameEl = item.querySelector('.entry-name, .file-name');
            const text = (nameEl ? nameEl.textContent : item.textContent).toLowerCase();
            const matches = text.includes(this.searchQuery);
            
            if (matches) {
                item.classList.remove('search-hidden');
                this.highlightText(nameEl || item, this.searchQuery);
                matchCount++;
                
                // Show and expand parent pack
                const packItem = item.closest('.pack-item');
                if (packItem) {
                    packItem.classList.remove('search-hidden');
                    matchedPacks.add(packItem);
                    
                    // Expand pack to show results
                    const packBody = packItem.querySelector('.pack-body');
                    if (packBody) {
                        packBody.classList.remove('collapsed');
                    }
                }
                
                // Show parent folder
                const folderItem = item.closest('.folder-item');
                if (folderItem) {
                    folderItem.classList.remove('search-hidden');
                    
                    // Expand folder
                    const folderFiles = folderItem.querySelector('.folder-files');
                    if (folderFiles) {
                        folderFiles.classList.remove('collapsed');
                    }
                }
                
                // Handle YAML file expansion
                if (item.classList.contains('yaml-file-header')) {
                    // This is a YAML file header that matches
                    const yamlFileItem = item.closest('.yaml-file-item');
                    if (yamlFileItem) {
                        yamlFileItem.classList.remove('search-hidden');
                        matchedYamlFiles.add(item);
                        yamlFilesWithMatchingHeader.add(yamlFileItem);
                    }
                } else if (item.classList.contains('entry-item')) {
                    // This is an entry inside a YAML file
                    const yamlFileItem = item.closest('.yaml-file-item');
                    if (yamlFileItem) {
                        yamlFileItem.classList.remove('search-hidden');
                        const header = yamlFileItem.querySelector('.yaml-file-header');
                        if (header) {
                            header.classList.remove('search-hidden');
                            matchedYamlFiles.add(header);
                        }
                    }
                }
            } else {
                item.classList.add('search-hidden');
            }
        });
        
        // Second pass: handle YAML file visibility
        matchedYamlFiles.forEach(header => {
            const yamlFileItem = header.closest('.yaml-file-item');
            if (yamlFileItem) {
                // Expand the entries container
                const entriesContainer = yamlFileItem.querySelector('.yaml-entries');
                if (entriesContainer) {
                    entriesContainer.classList.remove('collapsed');
                    
                    // Only show ALL entries if the YAML file header itself matches
                    if (yamlFilesWithMatchingHeader.has(yamlFileItem)) {
                        // File name matches - show all entries
                        const entries = entriesContainer.querySelectorAll('.entry-item');
                        entries.forEach(entry => {
                            entry.classList.remove('search-hidden');
                        });
                    }
                    // Otherwise, only matching entries are shown (already handled in first pass)
                }
            }
        });
        
        // Hide YAML file containers with no visible content
        document.querySelectorAll('.yaml-file-item, .yaml-file-container').forEach(yamlFile => {
            const visibleEntries = yamlFile.querySelectorAll('.entry-item:not(.search-hidden)');
            const header = yamlFile.querySelector('.yaml-file-header');
            
            if (visibleEntries.length === 0 && header && header.classList.contains('search-hidden')) {
                // No visible entries and header is hidden - hide entire container
                yamlFile.classList.add('search-hidden');
            } else {
                yamlFile.classList.remove('search-hidden');
            }
        });
        
        // Hide packs with no matches
        document.querySelectorAll('.pack-item').forEach(pack => {
            if (!matchedPacks.has(pack)) {
                pack.classList.add('search-hidden');
            }
        });
        
        // Hide empty folders
        document.querySelectorAll('.folder-item').forEach(folder => {
            const visibleItems = folder.querySelectorAll('.entry-item:not(.search-hidden), .yaml-file-header:not(.search-hidden)');
            if (visibleItems.length === 0) {
                folder.classList.add('search-hidden');
            } else {
                folder.classList.remove('search-hidden');
            }
        });
        
        // Show results count
        console.log(`🔍 Search: "${this.searchQuery}" - Found ${matchCount} result(s)`);
    }
    
    /**
     * Highlight matching text
     */
    highlightText(element, query) {
        if (!query || !element) return;
        
        // Remove any existing highlights first
        element.querySelectorAll('.search-highlight').forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            parent.normalize(); // Merge adjacent text nodes
        });
        
        // Get the text content directly
        const originalHTML = element.innerHTML;
        const text = element.textContent;
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        
        let index = lowerText.indexOf(lowerQuery);
        if (index === -1) return;
        
        // Build new HTML with highlighted matches
        let result = '';
        let lastIndex = 0;
        
        while (index !== -1) {
            // Add text before match
            result += this.escapeHtml(text.substring(lastIndex, index));
            
            // Add highlighted match
            const matchText = text.substring(index, index + query.length);
            result += `<span class="search-highlight">${this.escapeHtml(matchText)}</span>`;
            
            // Move to next
            lastIndex = index + query.length;
            index = lowerText.indexOf(lowerQuery, lastIndex);
        }
        
        // Add remaining text
        result += this.escapeHtml(text.substring(lastIndex));
        
        element.innerHTML = result;
    }
    
    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // =================================================================
    // RECENT FILES
    // =================================================================
    
    /**
     * Load recent files from storage
     */
    async loadRecentFiles() {
        try {
            const saved = await this.editor.storage.get('recentFiles');
            if (saved !== null && Array.isArray(saved)) {
                // Database has data (could be empty array or populated)
                this.recentFiles = saved;
            } else {
                // Fallback: Initialize empty array for users without database entry
                this.recentFiles = [];
                await this.editor.storage.set('recentFiles', []);
            }
        } catch (error) {
            // Handle errors gracefully
            console.warn('Failed to load recent files, using empty array:', error);
            this.recentFiles = [];
        }
    }
    
    /**
     * Save recent files to storage
     */
    async saveRecentFiles() {
        try {
            await this.editor.storage.set('recentFiles', this.recentFiles);
        } catch (error) {
            // Silently handle storage errors
            console.debug('Unable to save recent files to cloud storage');
        }
    }
    
    /**
     * Add file to recent files
     */
    async addToRecentFiles(fileId, fileName, fileType, packName) {
        // Remove if already exists
        this.recentFiles = this.recentFiles.filter(f => f.fileId !== fileId);
        
        // Add to beginning
        this.recentFiles.unshift({
            fileId,
            fileName,
            fileType,
            packName,
            timestamp: Date.now()
        });
        
        // Keep only last 10
        this.recentFiles = this.recentFiles.slice(0, 10);
        
        await this.saveRecentFiles();
        this.renderRecentFiles();
    }
    
    /**
     * Render recent files section
     */
    renderRecentFiles() {
        const section = document.getElementById('recent-files-section');
        const list = document.getElementById('recent-files-list');
        const count = document.getElementById('recent-files-count');
        
        if (!section || !list || !count) return;
        
        // Update count
        count.textContent = this.recentFiles.length;
        
        // Show/hide section
        if (this.recentFiles.length === 0) {
            section.classList.add('empty');
            return;
        }
        
        section.classList.remove('empty');
        
        // Render list
        const icons = {
            mob: 'fa-skull',
            skill: 'fa-magic',
            item: 'fa-gem',
            droptable: 'fa-table',
            randomspawn: 'fa-map-marked-alt'
        };
        
        list.innerHTML = this.recentFiles.map(file => {
            const isActive = this.editor.state.currentFile && this.editor.state.currentFile.id === file.fileId;
            return `
                <div class="recent-file-item ${isActive ? 'active' : ''}" 
                     data-file-id="${file.fileId}" 
                     data-file-type="${file.fileType}">
                    <i class="fas ${icons[file.fileType] || 'fa-file'} recent-file-icon"></i>
                    <div class="recent-file-info">
                        <div class="recent-file-name">${file.fileName}</div>
                        <div class="recent-file-meta">${file.packName} • ${file.fileType}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Click handlers are attached via event delegation in setupRecentFilesClickDelegation()
    }
    
    /**
     * Setup recent files section toggle
     */
    setupRecentFilesToggle() {
        // Only setup once
        if (this._recentFilesToggleSetup) return;
        
        const header = document.getElementById('recent-files-header');
        const section = document.getElementById('recent-files-section');
        
        if (!header || !section) {
            // Elements don't exist yet, don't set flag so we can try again later
            return;
        }
        
        header.addEventListener('click', () => {
            section.classList.toggle('collapsed');
            
            // Save state
            const isCollapsed = section.classList.contains('collapsed');
            localStorage.setItem('recentFilesCollapsed', isCollapsed);
        });
        
        // Restore state
        const savedState = localStorage.getItem('recentFilesCollapsed');
        if (savedState === 'false') {
            section.classList.remove('collapsed');
        }
        
        // Only set flag after successfully attaching listener
        this._recentFilesToggleSetup = true;
    }
    
    /**
     * Setup click delegation for recent files items
     */
    setupRecentFilesClickDelegation() {
        // Only setup once
        if (this._recentFilesClickDelegationSetup) return;
        
        const list = document.getElementById('recent-files-list');
        if (!list) {
            // Element doesn't exist yet, don't set flag so we can try again later
            return;
        }
        
        // Use event delegation on the list container
        list.addEventListener('click', (e) => {
            const item = e.target.closest('.recent-file-item');
            if (!item) return;
            
            const fileId = item.dataset.fileId;
            const fileType = item.dataset.fileType;
            if (fileId && fileType) {
                this.openFile(fileId, fileType);
            }
        });
        
        // Only set flag after successfully attaching listener
        this._recentFilesClickDelegationSetup = true;
    }
    
    // =================================================================
    // FAVORITES
    // =================================================================
    
    /**
     * Load favorites from storage
     */
    async loadFavorites() {
        try {
            const saved = await this.editor.storage.get('favorites');
            if (saved !== null && Array.isArray(saved)) {
                // Database has data (could be empty array or populated)
                this.favorites = new Set(saved);
            } else {
                // Fallback: Initialize empty arrays for users without database entries
                this.favorites = new Set();
                await this.editor.storage.set('favorites', []);
                await this.editor.storage.set('favoritesMetadata', {});
            }
        } catch (error) {
            // Handle errors gracefully
            console.warn('Failed to load favorites, using empty set:', error);
            this.favorites = new Set();
        }
    }
    
    /**
     * Save favorites to storage
     */
    async saveFavorites() {
        try {
            await this.editor.storage.set('favorites', Array.from(this.favorites));
        } catch (error) {
            // Silently handle storage errors
            console.debug('Unable to save favorites to cloud storage');
        }
    }
    
    /**
     * Toggle favorite status
     */
    async toggleFavorite(fileId, fileName, fileType, packName) {
        const key = fileId;
        
        if (this.favorites.has(key)) {
            this.favorites.delete(key);
        } else {
            // Store with metadata
            const favoriteData = { fileId, fileName, fileType, packName };
            this.favorites.add(key);
            
            // Also store metadata separately
            const metadata = await this.editor.storage.get('favoritesMetadata') || {};
            metadata[key] = favoriteData;
            await this.editor.storage.set('favoritesMetadata', metadata);
            
            // Invalidate cache so next render will fetch fresh data
            this._favoritesMetadataCache = null;
        }
        
        await this.saveFavorites();
        this.renderPackTree();
        this.renderFavorites();
    }
    
    /**
     * Check if file is favorited
     */
    isFavorited(fileId) {
        return this.favorites.has(fileId);
    }
    
    /**
     * Render favorites section
     */
    async renderFavorites() {
        const section = document.getElementById('favorites-section');
        const list = document.getElementById('favorites-list');
        const count = document.getElementById('favorites-count');
        
        if (!section || !list || !count) return;
        
        // Get metadata (cached to prevent repeated 406 errors)
        if (!this._favoritesMetadataCache) {
            try {
                this._favoritesMetadataCache = await this.editor.storage.get('favoritesMetadata') || {};
            } catch (error) {
                // Silently handle missing data - normal for first-time users
                this._favoritesMetadataCache = {};
            }
        }
        const metadata = this._favoritesMetadataCache;
        
        // Filter valid favorites
        const validFavorites = Array.from(this.favorites)
            .map(key => metadata[key])
            .filter(f => f);
        
        // Update count
        count.textContent = validFavorites.length;
        
        // Show/hide section
        if (validFavorites.length === 0) {
            section.classList.add('empty');
            return;
        }
        
        section.classList.remove('empty');
        
        // Render list
        const icons = {
            mob: 'fa-skull',
            skill: 'fa-magic',
            item: 'fa-gem',
            droptable: 'fa-table',
            randomspawn: 'fa-map-marked-alt'
        };
        
        list.innerHTML = validFavorites.map(file => {
            const isActive = this.editor.state.currentFile && this.editor.state.currentFile.id === file.fileId;
            return `
                <div class="favorite-item ${isActive ? 'active' : ''}" 
                     data-file-id="${file.fileId}" 
                     data-file-type="${file.fileType}">
                    <i class="fas ${icons[file.fileType] || 'fa-file'} favorite-icon"></i>
                    <div class="favorite-info">
                        <div class="favorite-name">${file.fileName}</div>
                        <div class="favorite-meta">${file.packName} • ${file.fileType}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Click handlers are attached via event delegation in setupFavoritesClickDelegation()
    }
    
    /**
     * Setup favorites section toggle
     */
    setupFavoritesToggle() {
        // Only setup once
        if (this._favoritesToggleSetup) return;
        
        const header = document.getElementById('favorites-header');
        const section = document.getElementById('favorites-section');
        
        if (!header || !section) {
            // Elements don't exist yet, don't set flag so we can try again later
            return;
        }
        
        header.addEventListener('click', () => {
            section.classList.toggle('collapsed');
            
            // Save state
            const isCollapsed = section.classList.contains('collapsed');
            localStorage.setItem('favoritesCollapsed', isCollapsed);
        });
        
        // Restore state
        const savedState = localStorage.getItem('favoritesCollapsed');
        if (savedState === 'false') {
            section.classList.remove('collapsed');
        }
        
        // Only set flag after successfully attaching listener
        this._favoritesToggleSetup = true;
    }
    
    /**
     * Setup click delegation for favorites items
     */
    setupFavoritesClickDelegation() {
        // Only setup once
        if (this._favoritesClickDelegationSetup) return;
        
        const list = document.getElementById('favorites-list');
        if (!list) {
            // Element doesn't exist yet, don't set flag so we can try again later
            return;
        }
        
        // Use event delegation on the list container
        list.addEventListener('click', (e) => {
            const item = e.target.closest('.favorite-item');
            if (!item) return;
            
            const fileId = item.dataset.fileId;
            const fileType = item.dataset.fileType;
            if (fileId && fileType) {
                this.openFile(fileId, fileType);
            }
        });
        
        // Only set flag after successfully attaching listener
        this._favoritesClickDelegationSetup = true;
    }
    
    // =================================================================
    // FILE STATUS INDICATORS
    // =================================================================
    
    /**
     * Set file status
     */
    setFileStatus(fileId, status) {
        this.fileStatuses.set(fileId, status);
    }
    
    /**
     * Get file status
     */
    getFileStatus(fileId) {
        return this.fileStatuses.get(fileId) || null;
    }
    
    /**
     * Mark file as modified
     */
    markFileModified(fileId) {
        this.setFileStatus(fileId, { modified: true, error: false, synced: false });
        this.updateFileStatusIndicator(fileId);
    }
    
    /**
     * Mark file as saved
     */
    markFileSaved(fileId) {
        this.setFileStatus(fileId, { modified: false, error: false, synced: true });
        this.updateFileStatusIndicator(fileId);
    }
    
    /**
     * Mark file as error
     */
    markFileError(fileId) {
        this.setFileStatus(fileId, { modified: false, error: true, synced: false });
        this.updateFileStatusIndicator(fileId);
    }
    
    /**
     * Update file status indicator in UI
     */
    updateFileStatusIndicator(fileId) {
        const elements = document.querySelectorAll(`[data-file-id="${fileId}"], [data-entry-id="${fileId}"]`);
        const status = this.getFileStatus(fileId);
        
        elements.forEach(el => {
            // Remove existing indicators
            const existing = el.querySelector('.file-status-indicator');
            if (existing) existing.remove();
            
            if (!status) return;
            
            // Add new indicator
            const indicator = document.createElement('div');
            indicator.className = 'file-status-indicator';
            
            if (status.modified) {
                indicator.innerHTML = '<span class="status-dot modified" title="Modified"></span>';
            } else if (status.error) {
                indicator.innerHTML = '<i class="fas fa-exclamation-circle status-icon error" title="Error"></i>';
            } else if (status.synced) {
                indicator.innerHTML = '<i class="fas fa-check-circle status-icon synced" title="Saved"></i>';
            }
            
            el.appendChild(indicator);
        });
    }
    
    // =================================================================
    // HELPER METHODS
    // =================================================================
    
    /**
     * Find a file across all packs
     * @returns {Object|null} { pack, file, entry } or null if not found
     */
    findFileInAllPacks(fileId, fileType) {
        for (const pack of this.packs) {
            const collection = pack[fileType + 's'];
            if (!collection) continue;
            
            // Search in file-based structure
            for (const file of collection) {
                // Check file level
                if (file.id === fileId) {
                    return { pack, file, entry: null };
                }
                
                // Check entry level
                if (file.entries) {
                    const entry = file.entries.find(e => e.id === fileId);
                    if (entry) {
                        return { pack, file, entry };
                    }
                }
            }
        }
        return null;
    }
    
    /**
     * Open a file (searches all packs)
     */
    openFile(fileId, fileType) {
        // Find the file across all packs
        const result = this.findFileInAllPacks(fileId, fileType);
        
        if (!result) {
            // File not found - show warning
            this.showMissingFileWarning(fileId, fileType);
            return;
        }
        
        // If file is in a different pack, switch to it first
        if (result.pack.id !== this.activePack?.id) {
            this.setActivePack(result.pack);
        }
        
        // Open the file or entry
        const itemToOpen = result.entry || result.file;
        this.editor.openFile(itemToOpen, fileType);
    }
    
    /**
     * Show warning when file no longer exists
     */
    showMissingFileWarning(fileId, fileType) {
        // Try to get file name from recent files or favorites metadata
        let fileName = 'Unknown file';
        
        // Check recent files
        const recentFile = this.recentFiles.find(f => f.fileId === fileId);
        if (recentFile) {
            fileName = recentFile.fileName;
        } else if (this._favoritesMetadataCache && this._favoritesMetadataCache[fileId]) {
            // Check favorites metadata
            fileName = this._favoritesMetadataCache[fileId].fileName;
        }
        
        // Show notification
        if (this.editor.notificationModal) {
            this.editor.notificationModal.show(
                'File Not Found',
                `The file "${fileName}" no longer exists. It may have been deleted or renamed.`,
                [
                    {
                        text: 'Remove from List',
                        primary: true,
                        callback: () => {
                            this.removeDeletedFile(fileId);
                        }
                    },
                    {
                        text: 'OK',
                        callback: () => {}
                    }
                ]
            );
        } else {
            // Fallback to alert if notification modal not available
            alert(`File "${fileName}" no longer exists.\n\nIt may have been deleted or renamed.`);
            this.removeDeletedFile(fileId);
        }
    }
    
    /**
     * Remove a deleted file from recent files and favorites
     */
    async removeDeletedFile(fileId) {
        // Remove from recent files
        const recentIndex = this.recentFiles.findIndex(f => f.fileId === fileId);
        if (recentIndex !== -1) {
            this.recentFiles.splice(recentIndex, 1);
            await this.saveRecentFiles();
            this.renderRecentFiles();
        }
        
        // Remove from favorites
        if (this.favorites.has(fileId)) {
            this.favorites.delete(fileId);
            
            // Remove from metadata
            if (this._favoritesMetadataCache && this._favoritesMetadataCache[fileId]) {
                delete this._favoritesMetadataCache[fileId];
                await this.editor.storage.set('favoritesMetadata', this._favoritesMetadataCache);
            }
            
            await this.saveFavorites();
            this.renderFavorites();
            this.renderPackTree();
        }
    }
    
    /**
     * Duplicate a file
     */
    duplicateFile(fileId, fileType) {
        // Implementation depends on existing duplicate functionality
        console.log('Duplicate file:', fileId, fileType);
        // Call appropriate editor duplicate method
    }
    
    /**
     * Export a file
     */
    exportFile(fileId, fileType) {
        // Implementation depends on existing export functionality
        console.log('Export file:', fileId, fileType);
        // Call appropriate export method
    }
}

window.PackManager = PackManager;
