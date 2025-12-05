/**
 * Pack Manager - Handles pack creation, management, and rendering
 */
class PackManager {
    constructor(editor) {
        this.editor = editor;
        this.packs = [];
        this.activePack = null;
        this.openDropdownPackId = null;
    }
    
    async loadPacks() {
        const saved = await this.editor.storage.get('packs');
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
    
    async savePacks() {
        try {
            // Update sync status UI
            if (this.editor.authUI) {
                this.editor.authUI.setSyncStatus('syncing');
            }
            
            await this.editor.storage.set('packs', this.packs);
            
            // Show success
            if (this.editor.authUI) {
                this.editor.authUI.showSyncSuccess();
            }
        } catch (error) {
            console.error('Failed to save packs:', error);
            if (this.editor.authUI) {
                this.editor.authUI.showSyncError();
            }
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
                    <button class="add-item-btn" data-type="droptable">
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
                    <button class="add-item-btn" data-type="item">
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
                    <button class="add-item-btn" data-type="mob">
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
                    <button class="add-item-btn" data-type="randomspawn">
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
                    <button class="add-item-btn" data-type="skill">
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
        
        return `
            <div class="entry-item ${isActive ? 'active' : ''} ${isPlaceholder ? 'placeholder-entry' : ''}" 
                 data-entry-id="${entry.id}" 
                 data-file-type="${type}"
                 data-parent-file-id="${parentFileId}">
                <i class="fas ${icons[type]} entry-icon"></i>
                <span>${displayName}</span>
                ${isPlaceholder ? '<span class="placeholder-badge">placeholder</span>' : ''}
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
        });
        
        // Entry item clicks (individual entries within YAML files)
        document.querySelectorAll('.entry-item').forEach(item => {
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
                
                const file = this.findFile(fileId, fileType);
                if (file) {
                    this.editor.openFile(file, fileType);
                }
            });
        });
        
        // Add item buttons
        document.querySelectorAll('.add-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
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
            items: materialItems,
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
    
    findFile(fileId, fileType) {
        if (!this.activePack) return null;
        
        const collection = this.activePack[fileType + 's'];
        if (!collection || collection.length === 0) return null;
        
        // Always use file-based structure - find file container by ID
        return collection.find(f => f.id === fileId);
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
            const inputName = prompt('Enter new pack name:', pack.name);
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
    
    deletePack(packId) {
        const pack = this.packs.find(p => p.id === packId);
        if (!pack) return;
        
        if (!confirm(`Are you sure you want to delete '${pack.name}'? This cannot be undone.`)) {
            return;
        }
        
        // Remove pack
        this.packs = this.packs.filter(p => p.id !== packId);
        
        // If it was active, clear and show dashboard
        if (this.activePack && this.activePack.id === packId) {
            this.activePack = this.packs[0] || null;
            this.editor.state.currentPack = this.activePack;
            this.editor.state.currentView = 'dashboard';
            
            // Show dashboard
            document.querySelectorAll('.view-container').forEach(view => {
                view.classList.remove('active');
            });
            document.getElementById('dashboard-view')?.classList.add('active');
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
}

window.PackManager = PackManager;
