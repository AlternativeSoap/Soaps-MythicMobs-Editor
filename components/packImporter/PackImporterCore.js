/**
 * PackImporterCore.js
 * Main orchestrator for the MythicMobs pack import system
 */
class PackImporter {
    constructor(options = {}) {
        this.options = {
            createPlaceholders: true,
            skipFilesWithCriticalErrors: true,
            autoSelectValidPacks: true,
            ...options
        };

        // Initialize components
        this.scanner = new PackFolderScanner();
        this.parser = new YamlFileParser();
        this.validator = new DataValidator();
        this.previewUI = new ImportPreviewUI();
        this.executor = new ImportExecutor();
        this.reportGenerator = new ImportReportGenerator();

        // State
        this.currentScanResults = null;
        this.currentParseResults = null;
        this.currentValidationResults = null;
        this.isImporting = false;

        // Hidden file input for fallback
        this.fileInput = null;

        this.init();
    }

    /**
     * Initialize the importer
     */
    init() {
        // Connect UI events
        this.previewUI.onImport = this.handleImport.bind(this);
        this.previewUI.onExportReport = this.handleExportReport.bind(this);
        
        // Create hidden file input for fallback method
        this.createFallbackInput();
    }

    /**
     * Create hidden file input element for fallback folder selection
     */
    createFallbackInput() {
        // Remove existing if present
        if (this.fileInput) {
            this.fileInput.remove();
        }

        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.webkitdirectory = true;
        this.fileInput.directory = true;
        this.fileInput.multiple = true;
        this.fileInput.style.display = 'none';
        this.fileInput.id = 'pack-importer-fallback-input';
        
        this.fileInput.addEventListener('change', async (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                console.log('✅ Fallback: Files selected via input:', files.length);
                await this.analyzeFallbackFiles(files);
            }
            // Reset input so same folder can be selected again
            this.fileInput.value = '';
        });

        document.body.appendChild(this.fileInput);
        console.log('📁 Fallback file input created');
    }

    /**
     * Start the import process - opens folder picker
     */
    async startImport() {
        if (this.isImporting) {
            alert('An import is already in progress');
            return;
        }

        // Comprehensive debug info
        console.log('╔══════════════════════════════════════════════════════════╗');
        console.log('║          PACK IMPORTER DEBUG INFO                        ║');
        console.log('╠══════════════════════════════════════════════════════════╣');
        console.log('║ Protocol:', window.location.protocol.padEnd(46) + '║');
        console.log('║ URL:', window.location.href.substring(0, 50).padEnd(51) + '║');
        console.log('║ Secure Context:', String(window.isSecureContext).padEnd(40) + '║');
        console.log('║ showDirectoryPicker:', (typeof window.showDirectoryPicker).padEnd(35) + '║');
        console.log('║ webkitdirectory supported:', String('webkitdirectory' in document.createElement('input')).padEnd(28) + '║');
        console.log('║ User Agent:', navigator.userAgent.substring(0, 44).padEnd(44) + '║');
        console.log('╚══════════════════════════════════════════════════════════╝');

        // Detect browser
        const isBrave = navigator.brave && await navigator.brave.isBrave();
        const isChrome = navigator.userAgent.includes('Chrome') && !isBrave;
        const isFirefox = navigator.userAgent.includes('Firefox');
        const isEdge = navigator.userAgent.includes('Edg/');
        const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
        
        console.log('🌐 Browser detection:', { isBrave, isChrome, isFirefox, isEdge, isSafari });

        try {
            // Determine best method
            const canUseDirectoryPicker = await this.canUseFileSystemAccessAPI();
            const canUseFallback = this.canUseFallbackMethod();
            
            console.log('📊 Method availability:', { canUseDirectoryPicker, canUseFallback });

            if (canUseDirectoryPicker) {
                console.log('✅ Using File System Access API (showDirectoryPicker)');
                await this.useFileSystemAccessAPI();
            } else if (canUseFallback) {
                console.log('✅ Using fallback method (webkitdirectory input)');
                this.useFallbackMethod();
            } else {
                console.error('❌ No folder selection method available');
                this.showNoMethodAvailable();
            }

        } catch (error) {
            console.error('❌ Error in startImport:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            if (error.name === 'AbortError') {
                console.log('ℹ️ Folder selection cancelled by user');
                return;
            }
            
            // Try fallback on any error
            if (this.canUseFallbackMethod()) {
                console.log('⚠️ Primary method failed, trying fallback...');
                this.useFallbackMethod();
            } else {
                alert(`Error: ${error.message}\n\nCheck the browser console (F12) for more details.`);
            }
        }
    }

    /**
     * Check if File System Access API can be used
     */
    async canUseFileSystemAccessAPI() {
        // Must be secure context
        if (!window.isSecureContext) {
            console.log('❌ Not secure context');
            return false;
        }

        // API must exist
        if (typeof window.showDirectoryPicker !== 'function') {
            console.log('❌ showDirectoryPicker is not a function, type:', typeof window.showDirectoryPicker);
            return false;
        }

        // Check for file:// protocol
        if (window.location.protocol === 'file:') {
            console.log('❌ Running from file:// protocol');
            return false;
        }

        // Test if API is actually callable (some browsers define but block it)
        try {
            // Create a test to see if the function throws immediately
            const testResult = window.showDirectoryPicker.toString();
            if (testResult.includes('native code')) {
                console.log('✅ showDirectoryPicker appears to be native and available');
                return true;
            }
        } catch (e) {
            console.log('⚠️ showDirectoryPicker test failed:', e.message);
        }

        return true; // Assume available and let actual call handle errors
    }

    /**
     * Check if fallback method (webkitdirectory) is available
     */
    canUseFallbackMethod() {
        const input = document.createElement('input');
        const supported = 'webkitdirectory' in input;
        console.log('📁 webkitdirectory support:', supported);
        return supported;
    }

    /**
     * Use File System Access API
     */
    async useFileSystemAccessAPI() {
        console.log('🚀 Opening folder picker via File System Access API...');
        
        const directoryHandle = await window.showDirectoryPicker({
            mode: 'read'
        });

        console.log('✅ Folder selected:', directoryHandle.name);
        await this.analyzeFolder(directoryHandle);
    }

    /**
     * Use fallback input method
     */
    useFallbackMethod() {
        console.log('🚀 Opening folder picker via fallback input...');
        
        if (!this.fileInput) {
            this.createFallbackInput();
        }
        
        this.fileInput.click();
    }

    /**
     * Show message when no method is available
     */
    showNoMethodAvailable() {
        const message = `⚠️ Folder Import Not Available

Your browser doesn't support folder selection.

Please try one of these browsers:
• Google Chrome 86+
• Microsoft Edge 86+
• Brave Browser (with Shields down for this site)

If you're on Chrome/Edge/Brave and still seeing this:
• Make sure you're running from a web server (not file://)
• Try disabling browser privacy extensions
• Try a private/incognito window

📁 Alternative: Use "Import YAML" (Ctrl+I) to import individual files.`;

        alert(message);
    }

    /**
     * Analyze files from fallback input
     */
    async analyzeFallbackFiles(fileList) {
        // Show loading state
        this.previewUI.show();
        this.previewUI.showLoading('Processing selected files...');

        try {
            console.log('📁 Processing', fileList.length, 'files from folder selection');

            // Group files by path structure
            const filesByPath = new Map();
            const rootPaths = new Set();
            
            for (const file of fileList) {
                // webkitRelativePath gives us the relative path from selected folder
                const relativePath = file.webkitRelativePath;
                const parts = relativePath.split('/');
                
                // Track the root folder name
                if (parts.length > 0) {
                    rootPaths.add(parts[0]);
                }

                filesByPath.set(relativePath, file);
            }

            console.log('📁 Root paths:', [...rootPaths]);
            console.log('📁 File paths sample:', [...filesByPath.keys()].slice(0, 10));

            // Build virtual folder structure from files
            const virtualStructure = this.buildVirtualStructure(fileList);
            
            // Detect folder type
            const folderType = this.detectFolderTypeFromFiles(virtualStructure);
            console.log('📁 Detected folder type:', folderType);

            // Scan using virtual structure
            this.previewUI.updateLoadingStatus('Analyzing folder structure...', 15);
            this.currentScanResults = await this.scanFromFiles(fileList, virtualStructure, folderType);
            
            if (!this.currentScanResults.packs || this.currentScanResults.packs.length === 0) {
                throw new Error('No valid MythicMobs packs found in the selected folder.\n\nExpected structure:\n- Packs folder with sub-folders containing Mobs/Skills/Items\n- Or a single pack folder with Mobs/Skills/Items folders');
            }

            // Phase 2: Parse YAML files
            this.previewUI.updateLoadingStatus('Parsing YAML files...', 30);
            this.currentParseResults = new Map();
            
            const totalPacks = this.currentScanResults.packs.length;
            for (let i = 0; i < totalPacks; i++) {
                const pack = this.currentScanResults.packs[i];
                const progress = 30 + Math.floor((i / totalPacks) * 30);
                this.previewUI.updateLoadingStatus(`Parsing ${pack.name}...`, progress);
                
                const packParseResults = await this.parsePackFromFiles(pack);
                this.currentParseResults.set(pack.name, packParseResults);
            }

            // Phase 3: Validate content
            this.previewUI.updateLoadingStatus('Validating content...', 60);
            this.currentValidationResults = new Map();
            
            for (let i = 0; i < totalPacks; i++) {
                const pack = this.currentScanResults.packs[i];
                const progress = 60 + Math.floor((i / totalPacks) * 30);
                this.previewUI.updateLoadingStatus(`Validating ${pack.name}...`, progress);
                
                const parseData = this.currentParseResults.get(pack.name);
                if (parseData) {
                    const validationResults = await this.validator.validatePack(parseData);
                    this.currentValidationResults.set(pack.name, validationResults);
                }
            }

            // Phase 4: Show preview
            this.previewUI.updateLoadingStatus('Preparing preview...', 95);
            this.previewUI.hideLoading();
            this.previewUI.render(
                this.currentScanResults,
                this.currentParseResults,
                this.currentValidationResults
            );

        } catch (error) {
            console.error('Analysis error:', error);
            this.previewUI.hideLoading();
            this.previewUI.showError(error.message);
        }
    }

    /**
     * Build virtual folder structure from file list
     */
    buildVirtualStructure(fileList) {
        const structure = {
            name: '',
            folders: {},
            files: []
        };

        for (const file of fileList) {
            const parts = file.webkitRelativePath.split('/');
            
            // Set root name from first file
            if (!structure.name && parts.length > 0) {
                structure.name = parts[0];
            }

            // Navigate/create folder structure
            let current = structure;
            for (let i = 1; i < parts.length - 1; i++) {
                const folderName = parts[i];
                if (!current.folders[folderName]) {
                    current.folders[folderName] = {
                        name: folderName,
                        folders: {},
                        files: []
                    };
                }
                current = current.folders[folderName];
            }

            // Add file to current folder
            current.files.push({
                name: parts[parts.length - 1],
                file: file,
                relativePath: file.webkitRelativePath
            });
        }

        return structure;
    }

    /**
     * Detect folder type from virtual structure
     */
    detectFolderTypeFromFiles(structure) {
        const folderNames = Object.keys(structure.folders);
        const mythicFolders = ['Mobs', 'Skills', 'Items', 'DropTables', 'RandomSpawns'];
        
        // Check if this is directly a pack (has Mobs/Skills/Items)
        const hasMythicFolders = mythicFolders.some(f => folderNames.includes(f));
        if (hasMythicFolders) {
            return 'single-pack';
        }

        // Check if subfolders look like packs
        for (const subName of folderNames) {
            const subFolder = structure.folders[subName];
            const subFolderNames = Object.keys(subFolder.folders);
            if (mythicFolders.some(f => subFolderNames.includes(f))) {
                return 'packs-folder';
            }
        }

        // Check if this is just a "Packs" folder rename
        if (folderNames.length > 0) {
            // Assume it's a packs folder with pack subfolders
            return 'packs-folder';
        }

        return 'unknown';
    }

    /**
     * Scan folder structure from file list
     */
    async scanFromFiles(fileList, virtualStructure, folderType) {
        const results = {
            type: folderType,
            rootName: virtualStructure.name,
            rootPath: virtualStructure.name, // For UI compatibility
            packs: [],
            summary: {
                totalFiles: fileList.length,
                totalPacks: 0,
                totalSize: 0,
                totalSizeFormatted: '0 B'
            },
            unsupportedFiles: [],
            errors: []
        };

        // Calculate total size
        for (const file of fileList) {
            results.summary.totalSize += file.size;
        }
        results.summary.totalSizeFormatted = this.formatFileSize(results.summary.totalSize);

        const mythicFolders = ['Mobs', 'Skills', 'Items', 'DropTables', 'RandomSpawns'];

        if (folderType === 'single-pack') {
            // Single pack - the selected folder IS the pack
            const pack = this.buildPackFromStructure(virtualStructure.name, virtualStructure, mythicFolders);
            if (pack) {
                results.packs.push(pack);
            }
        } else if (folderType === 'packs-folder') {
            // Multiple packs - subfolders are packs
            for (const [packName, packStructure] of Object.entries(virtualStructure.folders)) {
                const pack = this.buildPackFromStructure(packName, packStructure, mythicFolders);
                if (pack) {
                    results.packs.push(pack);
                }
            }
        }

        results.summary.totalPacks = results.packs.length;

        // Find unsupported files
        for (const file of fileList) {
            const ext = file.name.split('.').pop().toLowerCase();
            if (!['yml', 'yaml'].includes(ext)) {
                // Check if it's in a relevant folder
                const path = file.webkitRelativePath;
                if (mythicFolders.some(f => path.includes('/' + f + '/'))) {
                    results.unsupportedFiles.push({
                        path: file.webkitRelativePath,
                        name: file.name,
                        reason: `Unsupported file type: .${ext}`
                    });
                }
            }
        }

        console.log('📊 Scan results:', {
            packs: results.packs.map(p => p.name),
            totalFiles: results.summary.totalFiles,
            unsupportedFiles: results.unsupportedFiles.length
        });

        return results;
    }

    /**
     * Build pack info from folder structure
     */
    buildPackFromStructure(packName, structure, mythicFolders) {
        const pack = {
            name: packName,
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

        let hasContent = false;

        for (const folderName of mythicFolders) {
            const folder = structure.folders[folderName];
            const files = folder ? this.collectYamlFiles(folder, folderName) : [];
            
            // Calculate folder size
            let folderSize = 0;
            for (const file of files) {
                folderSize += file.size || 0;
            }
            
            pack.folders[folderName] = {
                exists: !!folder,
                handle: null, // No handle in fallback mode
                fileCount: files.length,
                files: files,
                totalFiles: files.length,
                totalSize: folderSize
            };

            // Update pack stats
            pack.stats.totalFiles += files.length;
            pack.stats.totalSize += folderSize;
            
            // Update filesByType - map folder names to stat keys
            const folderToStatKey = {
                'Mobs': 'mobs',
                'Skills': 'skills',
                'Items': 'items',
                'DropTables': 'droptables',
                'RandomSpawns': 'randomspawns'
            };
            const typeKey = folderToStatKey[folderName];
            if (typeKey && pack.stats.filesByType[typeKey] !== undefined) {
                pack.stats.filesByType[typeKey] = files.length;
            }

            if (files.length > 0) hasContent = true;
        }
        
        // Format the total size
        pack.stats.totalSizeFormatted = this.formatFileSize(pack.stats.totalSize);

        // Check for config files in root
        if (structure.files) {
            for (const fileInfo of structure.files) {
                const lowerName = fileInfo.name.toLowerCase();
                if (lowerName === 'packinfo.yml' || lowerName === 'packinfo.yaml') {
                    pack.configFiles.packinfo = {
                        exists: true,
                        handle: null,
                        name: fileInfo.name,
                        size: fileInfo.file?.size || 0
                    };
                } else if (lowerName === 'tooltips.yml' || lowerName === 'tooltips.yaml') {
                    pack.configFiles.tooltips = {
                        exists: true,
                        handle: null,
                        name: fileInfo.name,
                        size: fileInfo.file?.size || 0
                    };
                }
            }
        }

        return hasContent ? pack : null;
    }

    /**
     * Collect YAML files from folder structure recursively
     */
    collectYamlFiles(structure, basePath = '') {
        const files = [];

        // Add files from current folder
        for (const fileInfo of structure.files) {
            if (this.isYamlFile(fileInfo.name)) {
                files.push({
                    name: fileInfo.name,
                    file: fileInfo.file,
                    relativePath: fileInfo.relativePath,
                    size: fileInfo.file.size
                });
            }
        }

        // Recursively add from subfolders
        for (const [subName, subStructure] of Object.entries(structure.folders)) {
            const subFiles = this.collectYamlFiles(subStructure, basePath + '/' + subName);
            files.push(...subFiles);
        }

        return files;
    }

    /**
     * Check if file is YAML
     */
    isYamlFile(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        return ['yml', 'yaml'].includes(ext);
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Parse pack from file objects (fallback method)
     */
    async parsePackFromFiles(pack) {
        const results = {
            packName: pack.name,
            files: [],
            successfulFiles: 0,
            failedFiles: 0,
            totalEntries: 0,
            totalErrors: 0,
            totalWarnings: 0,
            byFolder: {}
        };

        const folders = ['Mobs', 'Skills', 'Items', 'DropTables', 'RandomSpawns'];
        
        for (const folderName of folders) {
            const folderData = pack.folders[folderName];
            if (!folderData || !folderData.exists) continue;

            results.byFolder[folderName] = {
                files: [],
                entries: []
            };

            for (const fileInfo of folderData.files) {
                const parseResult = await this.parseFileFromBlob(fileInfo.file, fileInfo.relativePath);
                
                results.files.push({
                    ...parseResult,
                    folderType: folderName
                });
                
                if (parseResult.success) {
                    results.successfulFiles++;
                    results.totalEntries += parseResult.entryCount;
                    results.byFolder[folderName].files.push(parseResult);
                    results.byFolder[folderName].entries.push(...Object.entries(parseResult.data || {}).map(([name, data]) => ({
                        name,
                        data,
                        sourcePath: fileInfo.relativePath
                    })));
                } else {
                    results.failedFiles++;
                }
                
                results.totalErrors += parseResult.errors?.length || 0;
                results.totalWarnings += parseResult.warnings?.length || 0;
            }
        }

        return results;
    }

    /**
     * Parse a file from File object (blob)
     */
    async parseFileFromBlob(file, relativePath) {
        const result = {
            path: relativePath,
            relativePath: relativePath, // For validator compatibility
            file: file.name,
            name: file.name,
            size: file.size,
            success: false,
            data: null,
            entries: [], // For validator compatibility
            entryCount: 0,
            errors: [],
            warnings: [],
            rawContent: ''
        };

        try {
            // Read file content
            const content = await this.readFileAsText(file);
            result.rawContent = content;

            // Check if empty
            if (!content.trim()) {
                result.warnings.push({
                    type: 'empty-file',
                    message: 'File is empty'
                });
                result.success = true;
                result.data = {};
                return result;
            }

            // Parse YAML
            if (typeof jsyaml === 'undefined') {
                throw new Error('js-yaml library not loaded. Please check that the CDN script is included.');
            }

            let parsed;
            let duplicateKeys = [];
            
            try {
                // First try with duplicate key detection
                parsed = jsyaml.load(content, {
                    schema: jsyaml.DEFAULT_SCHEMA,
                    json: true  // json:true allows duplicate keys (keeps last value)
                });
                
                // Now detect which keys were duplicated
                duplicateKeys = this.detectDuplicateKeys(content);
                
                if (duplicateKeys.length > 0) {
                    for (const dup of duplicateKeys) {
                        result.warnings.push({
                            type: 'duplicate-key',
                            message: `Duplicate key "${dup.key}" at line ${dup.line} (first defined at line ${dup.firstLine})`,
                            line: dup.line,
                            key: dup.key
                        });
                    }
                }
            } catch (yamlError) {
                // Handle YAML parsing error with better message
                let errorMessage = yamlError.message || 'Unknown YAML parsing error';
                let line = null;
                let column = null;
                
                // js-yaml stores position info in mark
                if (yamlError.mark) {
                    line = yamlError.mark.line + 1;
                    column = yamlError.mark.column + 1;
                    errorMessage = `YAML syntax error at line ${line}, column ${column}: ${yamlError.reason || errorMessage}`;
                }
                
                // Handle minified error messages (like just "r")
                if (errorMessage.length <= 2) {
                    errorMessage = `YAML parsing failed - possible syntax error (tabs, special characters, or invalid structure)`;
                }
                
                console.warn(`YAML parse warning for ${relativePath}:`, errorMessage);
                
                result.errors.push({
                    type: 'yaml-parse-error',
                    message: errorMessage,
                    line: line,
                    column: column,
                    snippet: this.extractErrorSnippet(content, line)
                });
                
                // Still mark as partially successful so the file shows in results
                result.success = false;
                result.data = {};
                result.entries = [];
                return result;
            }
            
            if (parsed === null || parsed === undefined) {
                result.warnings.push({
                    type: 'empty-yaml',
                    message: 'YAML parsed to null/undefined'
                });
                result.success = true;
                result.data = {};
                result.entries = [];
                return result;
            }

            if (typeof parsed !== 'object') {
                result.errors.push({
                    type: 'invalid-structure',
                    message: `Expected object but got ${typeof parsed}`,
                    line: 1
                });
                result.success = false;
                return result;
            }

            result.data = parsed;
            result.entryCount = Object.keys(parsed).length;
            
            // Build entries array for validator compatibility
            result.entries = Object.entries(parsed).map(([name, data]) => ({
                name,
                data,
                lineStart: null, // Line info not available from blob parsing
                lineEnd: null
            }));
            
            result.success = true;

        } catch (error) {
            console.error(`Error processing ${relativePath}:`, error);
            
            // Generic error (not YAML specific)
            result.errors.push({
                type: 'processing-error',
                message: error.message || 'Unknown error processing file',
                line: null,
                column: null
            });
            result.success = false;
        }

        return result;
    }

    /**
     * Read file as text
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    /**
     * Detect duplicate top-level keys in YAML content
     * MythicMobs files have top-level keys as mob/skill/item names
     */
    detectDuplicateKeys(content) {
        const duplicates = [];
        const keyPositions = new Map(); // key -> first line number
        
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;
            
            // Skip comments and empty lines
            if (line.trim().startsWith('#') || line.trim() === '') continue;
            
            // Match top-level keys (no leading whitespace, ends with colon)
            // Examples: ZOMBIE_HORDE:, INVISIBLE_SPIDER-Tick:
            const keyMatch = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:/);
            if (keyMatch) {
                const key = keyMatch[1];
                
                if (keyPositions.has(key)) {
                    duplicates.push({
                        key: key,
                        line: lineNum,
                        firstLine: keyPositions.get(key)
                    });
                } else {
                    keyPositions.set(key, lineNum);
                }
            }
        }
        
        return duplicates;
    }

    /**
     * Extract error snippet from content
     */
    extractErrorSnippet(content, errorLine) {
        if (!errorLine || !content) return null;
        
        const lines = content.split('\n');
        const start = Math.max(0, errorLine - 3);
        const end = Math.min(lines.length, errorLine + 2);
        
        return lines.slice(start, end).map((line, i) => ({
            lineNumber: start + i + 1,
            content: line,
            isError: start + i + 1 === errorLine
        }));
    }

    /**
     * Analyze the selected folder
     */
    async analyzeFolder(directoryHandle) {
        // Show loading state
        this.previewUI.show();
        this.previewUI.showLoading('Scanning folder structure...');

        try {
            // Phase 1: Scan folder structure
            this.previewUI.updateLoadingStatus('Scanning folder structure...', 10);
            this.currentScanResults = await this.scanner.scan(directoryHandle);
            
            if (!this.currentScanResults.packs || this.currentScanResults.packs.length === 0) {
                throw new Error('No valid MythicMobs packs found in the selected folder.\n\nExpected structure:\n- Packs folder with sub-folders\n- Or a single pack folder with Mobs/Skills/Items folders');
            }

            // Phase 2: Parse YAML files
            this.previewUI.updateLoadingStatus('Parsing YAML files...', 30);
            this.currentParseResults = new Map();
            
            const totalPacks = this.currentScanResults.packs.length;
            for (let i = 0; i < totalPacks; i++) {
                const pack = this.currentScanResults.packs[i];
                const progress = 30 + Math.floor((i / totalPacks) * 30);
                this.previewUI.updateLoadingStatus(`Parsing ${pack.name}...`, progress);
                
                const packParseResults = await this.parsePack(pack);
                this.currentParseResults.set(pack.name, packParseResults);
            }

            // Phase 3: Validate content
            this.previewUI.updateLoadingStatus('Validating content...', 60);
            this.currentValidationResults = new Map();
            
            for (let i = 0; i < totalPacks; i++) {
                const pack = this.currentScanResults.packs[i];
                const progress = 60 + Math.floor((i / totalPacks) * 30);
                this.previewUI.updateLoadingStatus(`Validating ${pack.name}...`, progress);
                
                const parseData = this.currentParseResults.get(pack.name);
                if (parseData) {
                    const validationResults = await this.validator.validatePack(parseData);
                    this.currentValidationResults.set(pack.name, validationResults);
                }
            }

            // Phase 4: Show preview
            this.previewUI.updateLoadingStatus('Preparing preview...', 95);
            this.previewUI.hideLoading();
            this.previewUI.render(
                this.currentScanResults,
                this.currentParseResults,
                this.currentValidationResults
            );

        } catch (error) {
            console.error('Analysis error:', error);
            this.previewUI.hideLoading();
            this.previewUI.showError(error.message);
        }
    }

    /**
     * Parse all YAML files in a pack (File System Access API method)
     */
    async parsePack(pack) {
        const results = {
            packName: pack.name,
            files: [],
            successfulFiles: 0,
            failedFiles: 0,
            totalEntries: 0,
            totalErrors: 0,
            totalWarnings: 0,
            byFolder: {}
        };

        const folders = ['Mobs', 'Skills', 'Items', 'DropTables', 'RandomSpawns'];
        
        for (const folderName of folders) {
            const folderData = pack.folders[folderName];
            if (!folderData || !folderData.exists) continue;

            results.byFolder[folderName] = {
                files: [],
                entries: []
            };

            for (const file of folderData.files) {
                const parseResult = await this.parser.parseFile(file.handle, file.relativePath);
                
                results.files.push({
                    ...parseResult,
                    folderType: folderName
                });
                
                if (parseResult.success) {
                    results.successfulFiles++;
                    results.totalEntries += parseResult.entryCount;
                    results.byFolder[folderName].files.push(parseResult);
                    results.byFolder[folderName].entries.push(...Object.entries(parseResult.data || {}).map(([name, data]) => ({
                        name,
                        data,
                        sourcePath: file.relativePath
                    })));
                } else {
                    results.failedFiles++;
                }
                
                results.totalErrors += parseResult.errors?.length || 0;
                results.totalWarnings += parseResult.warnings?.length || 0;
            }
        }

        return results;
    }

    /**
     * Handle import button click from UI
     */
    async handleImport(selectedPacks, options) {
        console.log('🚀 handleImport called with:', { selectedPacks, options });
        
        if (this.isImporting) {
            alert('An import is already in progress');
            return;
        }

        this.isImporting = true;
        
        try {
            // Build array of pack data in the format expected by ImportExecutor
            // ImportExecutor.execute expects: [{ pack, parseData, validation }, ...]
            const selectedPackData = [];
            
            console.log('📊 Current state:', {
                hasScanResults: !!this.currentScanResults,
                packsCount: this.currentScanResults?.packs?.length,
                hasParseResults: !!this.currentParseResults,
                parseResultsSize: this.currentParseResults?.size,
                hasValidationResults: !!this.currentValidationResults
            });
            
            for (const packName of selectedPacks) {
                // Find the pack object from scan results
                const pack = this.currentScanResults?.packs?.find(p => p.name === packName);
                const parseData = this.currentParseResults?.get(packName);
                const validation = this.currentValidationResults?.get(packName);
                
                console.log(`   Pack "${packName}":`, {
                    foundPack: !!pack,
                    foundParseData: !!parseData,
                    filesCount: parseData?.files?.length,
                    foundValidation: !!validation
                });
                
                if (pack && parseData) {
                    selectedPackData.push({
                        pack,
                        parseData,
                        validation: validation || { issues: [], statistics: {} }
                    });
                } else {
                    console.warn(`Could not find data for pack: ${packName}`);
                }
            }

            if (selectedPackData.length === 0) {
                throw new Error('No valid packs to import');
            }
            
            console.log(`📦 Executing import for ${selectedPackData.length} pack(s)...`);

            // Execute import
            const importResults = await this.executor.execute(
                selectedPackData,
                options,
                (progress, message) => {
                    this.previewUI.updateImportProgress(progress, message);
                }
            );
            
            console.log('✅ Import results:', importResults);

            // NOTE: updatePackManager was removed because ImportExecutor already saves packs
            // with the correct file-based structure via packManager.savePacks()
            // The old updatePackManager was broken - it iterated packResult.entries (an object)
            // as an array and pushed flat entries, corrupting the file-based structure.
            
            // Collapse all folders after import for cleaner UI
            if (window.packManager) {
                const folderTypes = ['mobs', 'skills', 'items', 'droptables', 'randomspawns'];
                folderTypes.forEach(folder => {
                    window.packManager.saveFolderState(folder, false);
                });
            }
            
            // Refresh the UI to show imported data with collapsed folders
            if (window.packManager?.refresh) {
                window.packManager.refresh();
            }

            // Generate post-import report
            const postReport = this.reportGenerator.generatePostImportReport(importResults);
            
            // Show results
            this.previewUI.showImportResults(importResults, postReport);
            
            return importResults;

        } catch (error) {
            console.error('Import error:', error);
            this.previewUI.showError(`Import failed: ${error.message}`);
            throw error;
        } finally {
            this.isImporting = false;
        }
    }

    /**
     * DEPRECATED - This method is no longer used
     * ImportExecutor now handles saving packs directly with the correct file-based structure.
     * This method was broken because packResult.entries is an object {mobs:[], skills:[], ...}
     * not an array, so iterating over it didn't work correctly.
     * @deprecated
     */
    updatePackManager(importResults) {
        for (const packResult of importResults.packs) {
            // Create or get pack
            let pack = window.packManager?.getPack(packResult.packName);
            if (!pack) {
                pack = window.packManager?.createPack(packResult.packName);
            }

            if (!pack) continue;

            // Add entries to pack
            for (const entry of packResult.entries) {
                switch (entry.type) {
                    case 'mob':
                        pack.mobs = pack.mobs || [];
                        pack.mobs.push(entry.data);
                        break;
                    case 'skill':
                        pack.skills = pack.skills || [];
                        pack.skills.push(entry.data);
                        break;
                    case 'item':
                        pack.items = pack.items || [];
                        pack.items.push(entry.data);
                        break;
                    case 'droptable':
                        pack.droptables = pack.droptables || [];
                        pack.droptables.push(entry.data);
                        break;
                    case 'randomspawn':
                        pack.randomspawns = pack.randomspawns || [];
                        pack.randomspawns.push(entry.data);
                        break;
                }
            }

            // Save pack if storage manager available
            if (window.storageManager) {
                window.storageManager.savePack(packResult.packName, pack);
            }
        }

        // Refresh UI
        if (window.packManager?.refresh) {
            window.packManager.refresh();
        }
    }

    /**
     * Handle export report button click
     */
    handleExportReport(format) {
        if (!this.currentScanResults || !this.currentParseResults || !this.currentValidationResults) {
            alert('No data to export. Please scan a folder first.');
            return;
        }

        this.reportGenerator.exportReport(
            this.currentScanResults,
            this.currentParseResults,
            this.currentValidationResults,
            format
        );
    }

    /**
     * Close the import dialog
     */
    close() {
        this.previewUI.hide();
        this.reset();
    }

    /**
     * Reset state
     */
    reset() {
        this.currentScanResults = null;
        this.currentParseResults = null;
        this.currentValidationResults = null;
        this.isImporting = false;
    }

    /**
     * Get import statistics
     */
    getStatistics() {
        if (!this.currentScanResults) return null;

        return {
            packs: this.currentScanResults.packs.length,
            files: this.currentScanResults.summary.totalFiles,
            size: this.currentScanResults.summary.totalSizeFormatted,
            issues: this.currentValidationResults ? this.countIssues() : 0
        };
    }

    /**
     * Count total issues
     */
    countIssues() {
        let count = 0;
        for (const [, validation] of this.currentValidationResults) {
            if (validation && validation.summary) {
                count += validation.summary.totalCritical;
                count += validation.summary.totalWarnings;
            }
        }
        return count;
    }
}

// Export class globally
window.PackImporter = PackImporter;

// Note: PackImporter is initialized on-demand when importPack() is called
// This avoids initialization order issues with the editor
