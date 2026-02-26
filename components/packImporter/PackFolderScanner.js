/**
 * PackFolderScanner.js
 * Scans folder structure to detect MythicMobs packs
 */
class PackFolderScanner {
    constructor() {
        // Standard MythicMobs folders
        this.MYTHICMOBS_FOLDERS = ['Mobs', 'Skills', 'Items', 'DropTables', 'RandomSpawns', 'Assets'];
        this.CONFIG_FILES = ['packinfo.yml', 'tooltips.yml'];
        this.YAML_EXTENSIONS = ['.yml', '.yaml'];
        
        // files/ directory: filename.type.yml naming convention
        // Maps the type suffix to the target folder/category
        this.FILES_DIR_TYPE_MAP = {
            'mob': 'Mobs',
            'skill': 'Skills',
            'item': 'Items',
            'droptable': 'DropTables',
            'randomspawn': 'RandomSpawns',
            'placeholder': 'Placeholders',
            'spawner': 'Spawners',
            'schematic': 'Schematics',
            'lore': 'LoreTemplates',
            'font': 'Fonts',
            'worldgen': 'WorldGen',
            'equipment': 'EquipmentSets',
            'tooltip': 'Tooltips',
            'augment': 'Augments',
            'stat': 'Stats'
        };
    }

    /**
     * Main entry point - scan a folder handle
     * @param {FileSystemDirectoryHandle} dirHandle 
     * @returns {Promise<Object>} Scan results
     */
    async scan(dirHandle) {
        
        const result = {
            type: null, // 'packs-folder' or 'single-pack'
            rootPath: dirHandle.name,
            rootHandle: dirHandle,
            packs: [],
            summary: {
                totalPacks: 0,
                totalFiles: 0,
                totalSize: 0,
                totalSizeFormatted: '0 B'
            },
            scanTime: 0
        };

        const startTime = performance.now();

        try {
            // First, determine if this is a Packs folder or a single pack
            const folderType = await this.detectFolderType(dirHandle);
            result.type = folderType;

            if (folderType === 'single-folder') {
                // User selected a single MythicMobs folder (e.g., just "Skills" folder)
                const folderName = dirHandle.name;
                const packName = `Imported ${folderName}`;
                
                // Create a pack structure with only this folder
                const pack = {
                    name: packName,
                    handle: null, // We don't store the handle as it references the folder itself
                    folders: {},
                    configFiles: {
                        packinfo: { exists: false, handle: null, size: 0 },
                        tooltips: { exists: false, handle: null, size: 0 }
                    },
                    unknownFolders: [],
                    unknownFiles: [],
                    stats: {
                        totalFiles: 0,
                        totalSize: 0,
                        totalSizeFormatted: '0 B',
                        filesByType: {
                            mobs: 0,
                            skills: 0,
                            items: 0,
                            droptables: 0,
                            randomspawns: 0,
                            assets: 0
                        }
                    }
                };
                
                // Initialize all folder structures
                this.MYTHICMOBS_FOLDERS.forEach(folder => {
                    pack.folders[folder] = {
                        exists: false,
                        handle: null,
                        files: [],
                        subfolders: [],
                        totalFiles: 0,
                        totalSize: 0
                    };
                });
                
                // Scan the selected folder and add its content
                const folderData = await this.scanFolder(dirHandle, folderName);
                pack.folders[folderName] = {
                    exists: true,
                    handle: dirHandle,
                    ...folderData
                };
                
                // Update pack stats
                pack.stats.totalFiles = folderData.totalFiles;
                pack.stats.totalSize = folderData.totalSize;
                pack.stats.totalSizeFormatted = this.formatFileSize(folderData.totalSize);
                
                const typeKey = folderName.toLowerCase().replace('s', '');
                if (pack.stats.filesByType[typeKey] !== undefined) {
                    pack.stats.filesByType[typeKey] = folderData.totalFiles;
                }
                
                result.packs.push(pack);
                
            } else if (folderType === 'packs-folder') {
                // Scan all subfolders as individual packs
                result.packs = await this.scanPacksFolder(dirHandle);
            } else if (folderType === 'single-pack') {
                // Scan this folder as a single pack
                const pack = await this.scanSinglePack(dirHandle, dirHandle.name);
                if (pack) {
                    result.packs.push(pack);
                }
            } else {
                // Unknown structure
                if (window.DEBUG_MODE) console.warn('Could not determine folder structure');
            }

            // Calculate summary
            result.summary.totalPacks = result.packs.length;
            result.packs.forEach(pack => {
                result.summary.totalFiles += pack.stats.totalFiles;
                result.summary.totalSize += pack.stats.totalSize;
            });
            result.summary.totalSizeFormatted = this.formatFileSize(result.summary.totalSize);

        } catch (error) {
            console.error('Scan error:', error);
            throw error;
        }

        result.scanTime = performance.now() - startTime;
        if (window.DEBUG_MODE) console.log(`Scan complete in ${result.scanTime.toFixed(0)}ms`);

        return result;
    }

    /**
     * Detect if folder is a Packs folder or a single pack
     */
    async detectFolderType(dirHandle) {
        const entries = [];
        
        for await (const entry of dirHandle.values()) {
            entries.push({
                name: entry.name,
                kind: entry.kind
            });
        }

        // NEW: Check if the selected folder itself IS a MythicMobs folder
        const folderName = dirHandle.name || '';
        const isSingleMythicFolder = this.MYTHICMOBS_FOLDERS.some(
            f => f.toLowerCase() === folderName.toLowerCase()
        );
        
        if (isSingleMythicFolder) {
            // Check if it has YAML files
            const hasYamlFiles = entries.some(e => 
                e.kind === 'file' && this.YAML_EXTENSIONS.includes(this.getFileExtension(e.name))
            );
            if (hasYamlFiles) {
                return 'single-folder';
            }
        }

        // Check if this folder directly contains MythicMobs folders (case-insensitive)
        const hasMythicMobsFolders = entries.some(e => 
            e.kind === 'directory' && this.MYTHICMOBS_FOLDERS.some(
                f => f.toLowerCase() === e.name.toLowerCase()
            )
        );

        if (hasMythicMobsFolders) {
            return 'single-pack';
        }

        // Check if subfolders contain MythicMobs folders (Packs folder)
        for (const entry of entries) {
            if (entry.kind === 'directory') {
                try {
                    const subDir = await dirHandle.getDirectoryHandle(entry.name);
                    const hasMMFolders = await this.checkForMythicMobsFolders(subDir);
                    if (hasMMFolders) {
                        return 'packs-folder';
                    }
                } catch (e) {
                    // Skip inaccessible folders
                }
            }
        }

        // Check if it's empty or has only files
        const hasDirectories = entries.some(e => e.kind === 'directory');
        if (!hasDirectories) {
            return 'unknown';
        }

        return 'unknown';
    }

    /**
     * Check if a directory contains MythicMobs standard folders
     */
    async checkForMythicMobsFolders(dirHandle) {
        for await (const entry of dirHandle.values()) {
            // Case-insensitive folder matching
            if (entry.kind === 'directory') {
                const matchedFolder = this.MYTHICMOBS_FOLDERS.find(
                    f => f.toLowerCase() === entry.name.toLowerCase()
                );
                if (matchedFolder) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Scan a Packs folder containing multiple packs
     */
    async scanPacksFolder(dirHandle) {
        const packs = [];

        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'directory') {
                try {
                    const packDir = await dirHandle.getDirectoryHandle(entry.name);
                    const hasMMFolders = await this.checkForMythicMobsFolders(packDir);
                    
                    if (hasMMFolders) {
                        const pack = await this.scanSinglePack(packDir, entry.name);
                        if (pack) {
                            packs.push(pack);
                        }
                    } else {
                        if (window.DEBUG_MODE) console.log(`Skipping non-pack folder: ${entry.name}`);
                    }
                } catch (e) {
                    if (window.DEBUG_MODE) console.warn(`Could not access folder: ${entry.name}`, e);
                }
            }
        }

        return packs;
    }

    /**
     * Scan a single pack folder
     */
    async scanSinglePack(dirHandle, packName) {
        if (window.DEBUG_MODE) console.log(`Scanning pack: ${packName}`);

        const pack = {
            name: packName,
            handle: dirHandle,
            folders: {},
            configFiles: {
                packinfo: { exists: false, handle: null, size: 0 },
                tooltips: { exists: false, handle: null, size: 0 }
            },
            unknownFolders: [],
            unknownFiles: [],
            stats: {
                totalFiles: 0,
                totalSize: 0,
                totalSizeFormatted: '0 B',
                filesByType: {
                    mobs: 0,
                    skills: 0,
                    items: 0,
                    droptables: 0,
                    randomspawns: 0,
                    assets: 0
                }
            }
        };

        // Initialize folder structures
        this.MYTHICMOBS_FOLDERS.forEach(folder => {
            pack.folders[folder] = {
                exists: false,
                handle: null,
                files: [],
                subfolders: [],
                totalFiles: 0,
                totalSize: 0
            };
        });

        // Scan the pack directory
        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'directory') {
                // Check for the new files/ directory
                if (entry.name.toLowerCase() === 'files') {
                    try {
                        const filesDirHandle = await dirHandle.getDirectoryHandle(entry.name);
                        const filesData = await this.scanFilesDirectory(filesDirHandle);
                        pack.filesDirectory = filesData;
                        
                        // Update stats with files/ directory contents
                        pack.stats.totalFiles += filesData.totalFiles;
                        pack.stats.totalSize += filesData.totalSize;
                        
                        if (window.DEBUG_MODE) {
                            console.log(`📁 files/ directory found with ${filesData.totalFiles} files:`, filesData.categorized);
                        }
                    } catch (e) {
                        if (window.DEBUG_MODE) console.warn('Could not scan files/ directory:', e);
                    }
                    continue;
                }
                
                // Case-insensitive folder matching
                const matchedFolder = this.MYTHICMOBS_FOLDERS.find(
                    f => f.toLowerCase() === entry.name.toLowerCase()
                );
                if (matchedFolder) {
                    // Standard MythicMobs folder (use canonical name for consistency)
                    const folderHandle = await dirHandle.getDirectoryHandle(entry.name);
                    const folderData = await this.scanFolder(folderHandle, entry.name);
                    
                    pack.folders[matchedFolder] = {
                        exists: true,
                        handle: folderHandle,
                        ...folderData
                    };

                    // Update stats
                    const typeKey = matchedFolder.toLowerCase().replace('s', '');
                    if (pack.stats.filesByType[typeKey] !== undefined) {
                        pack.stats.filesByType[typeKey] = folderData.totalFiles;
                    }
                    pack.stats.totalFiles += folderData.totalFiles;
                    pack.stats.totalSize += folderData.totalSize;
                } else {
                    // Unknown folder
                    pack.unknownFolders.push(entry.name);
                }
            } else if (entry.kind === 'file') {
                const lowerName = entry.name.toLowerCase();
                
                if (lowerName === 'packinfo.yml' || lowerName === 'packinfo.yaml') {
                    const fileHandle = await dirHandle.getFileHandle(entry.name);
                    const file = await fileHandle.getFile();
                    pack.configFiles.packinfo = {
                        exists: true,
                        handle: fileHandle,
                        name: entry.name,
                        size: file.size
                    };
                    pack.stats.totalFiles++;
                    pack.stats.totalSize += file.size;
                } else if (lowerName === 'tooltips.yml' || lowerName === 'tooltips.yaml') {
                    const fileHandle = await dirHandle.getFileHandle(entry.name);
                    const file = await fileHandle.getFile();
                    pack.configFiles.tooltips = {
                        exists: true,
                        handle: fileHandle,
                        name: entry.name,
                        size: file.size
                    };
                    pack.stats.totalFiles++;
                    pack.stats.totalSize += file.size;
                } else {
                    pack.unknownFiles.push(entry.name);
                }
            }
        }

        pack.stats.totalSizeFormatted = this.formatFileSize(pack.stats.totalSize);

        return pack;
    }

    /**
     * Recursively scan a folder for YAML files
     */
    async scanFolder(dirHandle, folderName) {
        const result = {
            files: [],
            subfolders: [],
            totalFiles: 0,
            totalSize: 0
        };

        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file') {
                const ext = this.getFileExtension(entry.name);
                if (this.YAML_EXTENSIONS.includes(ext)) {
                    try {
                        const fileHandle = await dirHandle.getFileHandle(entry.name);
                        const file = await fileHandle.getFile();
                        
                        result.files.push({
                            name: entry.name,
                            handle: fileHandle,
                            size: file.size,
                            sizeFormatted: this.formatFileSize(file.size)
                        });
                        
                        result.totalFiles++;
                        result.totalSize += file.size;
                    } catch (e) {
                        if (window.DEBUG_MODE) console.warn(`Could not read file: ${entry.name}`, e);
                    }
                }
            } else if (entry.kind === 'directory') {
                try {
                    const subDirHandle = await dirHandle.getDirectoryHandle(entry.name);
                    const subfolderData = await this.scanFolder(subDirHandle, entry.name);
                    
                    result.subfolders.push({
                        name: entry.name,
                        handle: subDirHandle,
                        ...subfolderData
                    });
                    
                    result.totalFiles += subfolderData.totalFiles;
                    result.totalSize += subfolderData.totalSize;
                } catch (e) {
                    if (window.DEBUG_MODE) console.warn(`Could not access subfolder: ${entry.name}`, e);
                }
            }
        }

        return result;
    }

    /**
     * Get file extension
     */
    getFileExtension(filename) {
        const lastDot = filename.lastIndexOf('.');
        return lastDot >= 0 ? filename.substring(lastDot).toLowerCase() : '';
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const units = ['B', 'KB', 'MB', 'GB'];
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
    }

    /**
     * Get all files from a pack folder structure (flattened)
     */
    getAllFiles(pack, folderType) {
        const files = [];
        const folder = pack.folders[folderType];
        
        if (!folder || !folder.exists) return files;

        // Add direct files
        folder.files.forEach(file => {
            files.push({
                ...file,
                relativePath: `${folderType}/${file.name}`,
                folderType: folderType
            });
        });

        // Add files from subfolders recursively
        const addSubfolderFiles = (subfolder, basePath) => {
            subfolder.files.forEach(file => {
                files.push({
                    ...file,
                    relativePath: `${basePath}/${file.name}`,
                    folderType: folderType
                });
            });

            subfolder.subfolders.forEach(sub => {
                addSubfolderFiles(sub, `${basePath}/${sub.name}`);
            });
        };

        folder.subfolders.forEach(sub => {
            addSubfolderFiles(sub, `${folderType}/${sub.name}`);
        });

        return files;
    }

    /**
     * Parse a filename from the files/ directory to determine its type.
     * Format: filename.type.yml (e.g., bossMob.mob.yml, healSkill.skill.yml)
     * @param {string} filename - The file name
     * @returns {Object|null} - { baseName, fileType, category } or null if not parseable
     */
    parseFilesDirectoryName(filename) {
        // Match pattern: name.type.yml or name.type.yaml
        const match = filename.match(/^(.+)\.([a-zA-Z]+)\.(yml|yaml)$/i);
        if (!match) return null;
        
        const baseName = match[1];
        const typeSuffix = match[2].toLowerCase();
        const category = this.FILES_DIR_TYPE_MAP[typeSuffix];
        
        if (!category) return null;
        
        return {
            baseName,
            fileType: typeSuffix,
            category
        };
    }

    /**
     * Scan the files/ directory recursively.
     * Files in this directory are parsed based on their name regardless of location.
     * @param {FileSystemDirectoryHandle} dirHandle 
     * @returns {Promise<Object>} Categorized files
     */
    async scanFilesDirectory(dirHandle) {
        const result = {
            files: [],
            categorized: {},  // category -> [files]
            totalFiles: 0,
            totalSize: 0
        };

        // Initialize categories
        Object.values(this.FILES_DIR_TYPE_MAP).forEach(cat => {
            result.categorized[cat] = [];
        });

        const scanRecursive = async (handle, relativePath) => {
            for await (const entry of handle.values()) {
                if (entry.kind === 'file') {
                    const ext = this.getFileExtension(entry.name);
                    if (this.YAML_EXTENSIONS.includes(ext)) {
                        try {
                            const fileHandle = await handle.getFileHandle(entry.name);
                            const file = await fileHandle.getFile();
                            const parsed = this.parseFilesDirectoryName(entry.name);
                            
                            const fileInfo = {
                                name: entry.name,
                                handle: fileHandle,
                                size: file.size,
                                sizeFormatted: this.formatFileSize(file.size),
                                relativePath: relativePath ? `${relativePath}/${entry.name}` : entry.name,
                                parsedType: parsed
                            };
                            
                            result.files.push(fileInfo);
                            result.totalFiles++;
                            result.totalSize += file.size;
                            
                            if (parsed) {
                                if (!result.categorized[parsed.category]) {
                                    result.categorized[parsed.category] = [];
                                }
                                result.categorized[parsed.category].push(fileInfo);
                            }
                        } catch (e) {
                            if (window.DEBUG_MODE) console.warn(`Could not read file in files/: ${entry.name}`, e);
                        }
                    }
                } else if (entry.kind === 'directory') {
                    try {
                        const subDirHandle = await handle.getDirectoryHandle(entry.name);
                        const subPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
                        await scanRecursive(subDirHandle, subPath);
                    } catch (e) {
                        if (window.DEBUG_MODE) console.warn(`Could not access subfolder in files/: ${entry.name}`, e);
                    }
                }
            }
        };

        await scanRecursive(dirHandle, '');
        return result;
    }

    /**
     * Get all files from all folders in a pack
     */
    getAllPackFiles(pack) {
        const allFiles = [];
        
        this.MYTHICMOBS_FOLDERS.forEach(folderType => {
            const files = this.getAllFiles(pack, folderType);
            allFiles.push(...files);
        });

        // Add config files
        if (pack.configFiles.packinfo.exists) {
            allFiles.push({
                ...pack.configFiles.packinfo,
                relativePath: pack.configFiles.packinfo.name,
                folderType: 'config'
            });
        }
        if (pack.configFiles.tooltips.exists) {
            allFiles.push({
                ...pack.configFiles.tooltips,
                relativePath: pack.configFiles.tooltips.name,
                folderType: 'config'
            });
        }

        // Add files from files/ directory
        if (pack.filesDirectory && pack.filesDirectory.files) {
            pack.filesDirectory.files.forEach(file => {
                allFiles.push({
                    ...file,
                    relativePath: `files/${file.relativePath}`,
                    folderType: file.parsedType ? file.parsedType.fileType : 'unknown'
                });
            });
        }

        return allFiles;
    }
}

window.PackFolderScanner = PackFolderScanner;
