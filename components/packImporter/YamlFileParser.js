/**
 * YamlFileParser.js
 * Parse YAML files with comprehensive error tracking
 */
class YamlFileParser {
    constructor() {
        this.parsedFiles = new Map();
    }

    /**
     * Parse a single YAML file
     * @param {FileSystemFileHandle} fileHandle 
     * @param {string} relativePath 
     * @param {string} folderType 
     * @returns {Promise<Object>} Parse result
     */
    async parseFile(fileHandle, relativePath, folderType) {
        const result = {
            file: fileHandle.name,
            relativePath: relativePath,
            folderType: folderType,
            success: false,
            entries: [],
            errors: [],
            warnings: [],
            rawContent: '',
            lineCount: 0
        };

        try {
            const file = await fileHandle.getFile();
            const content = await file.text();
            result.rawContent = content;
            result.lineCount = content.split('\n').length;

            // Check for empty file
            if (!content.trim()) {
                result.warnings.push({
                    type: 'EMPTY_FILE',
                    line: 1,
                    message: 'File is empty',
                    severity: 'info'
                });
                result.success = true;
                return result;
            }

            // Check for tabs
            const tabLines = this.findTabLines(content);
            if (tabLines.length > 0) {
                result.warnings.push({
                    type: 'TABS_DETECTED',
                    lines: tabLines,
                    message: `Tab characters detected on ${tabLines.length} line(s). MythicMobs prefers spaces.`,
                    severity: 'warning'
                });
            }

            // Parse YAML
            try {
                const parsed = this.parseYamlContent(content);
                
                if (parsed && typeof parsed === 'object') {
                    // Extract entries (MythicMobs files have multiple top-level keys)
                    const topLevelKeys = Object.keys(parsed);
                    console.log(`📄 Parsing ${relativePath}: found ${topLevelKeys.length} top-level entries:`, topLevelKeys);
                    
                    for (const [name, data] of Object.entries(parsed)) {
                        const lineInfo = this.findEntryLines(content, name);
                        result.entries.push({
                            name: name,
                            data: data,
                            lineStart: lineInfo.start,
                            lineEnd: lineInfo.end
                        });
                    }
                    
                    console.log(`   ✅ Added ${result.entries.length} entries to result`);
                    result.success = true;
                } else {
                    result.errors.push({
                        type: 'INVALID_YAML',
                        line: 1,
                        message: 'YAML did not parse to an object',
                        severity: 'critical'
                    });
                }
            } catch (yamlError) {
                const errorInfo = this.parseYamlError(yamlError, content);
                result.errors.push(errorInfo);
            }

        } catch (error) {
            result.errors.push({
                type: 'FILE_READ_ERROR',
                line: 1,
                message: `Could not read file: ${error.message}`,
                severity: 'critical'
            });
        }

        this.parsedFiles.set(relativePath, result);
        return result;
    }

    /**
     * Parse YAML content using built-in or simple parser
     */
    parseYamlContent(content) {
        // Try using js-yaml if available
        if (typeof jsyaml !== 'undefined') {
            const parsed = jsyaml.load(content);
            console.log('   Parsed result type:', typeof parsed, 'Keys:', parsed ? Object.keys(parsed).length : 0);
            return parsed;
        }
        
        // Fallback to simple YAML parser
        return this.simpleYamlParse(content);
    }

    /**
     * Simple YAML parser for basic MythicMobs configurations
     * Parses all top-level keys and their nested content
     */
    simpleYamlParse(content) {
        const result = {};
        const lines = content.split('\n');
        let currentTopLevel = null;
        let currentData = {};
        let currentLines = [];
        let inTopLevel = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith('#')) continue;

            // Calculate indent
            const indent = line.search(/\S/);
            if (indent === -1) continue;

            // Check for top-level key (no indent, ends with colon)
            if (indent === 0 && trimmed.includes(':')) {
                // Save previous top-level entry
                if (currentTopLevel !== null) {
                    result[currentTopLevel] = this.parseNestedContent(currentLines);
                }
                
                // Extract the key name (everything before the first colon)
                const colonIndex = trimmed.indexOf(':');
                currentTopLevel = trimmed.substring(0, colonIndex).trim();
                
                // Check if there's an inline value
                const afterColon = trimmed.substring(colonIndex + 1).trim();
                if (afterColon && !afterColon.startsWith('#')) {
                    // Inline value - simple key: value at top level
                    result[currentTopLevel] = this.parseValue(afterColon);
                    currentTopLevel = null;
                    currentLines = [];
                } else {
                    // Start collecting nested content
                    currentLines = [];
                    inTopLevel = true;
                }
                continue;
            }

            // Collect nested content for current top-level key
            if (inTopLevel && currentTopLevel !== null && indent > 0) {
                currentLines.push(line);
            }
        }

        // Save last entry
        if (currentTopLevel !== null && currentLines.length > 0) {
            result[currentTopLevel] = this.parseNestedContent(currentLines);
        } else if (currentTopLevel !== null) {
            result[currentTopLevel] = {};
        }

        console.log(`📋 simpleYamlParse found ${Object.keys(result).length} top-level entries:`, Object.keys(result));
        return result;
    }
    
    /**
     * Parse nested content lines into an object
     */
    parseNestedContent(lines) {
        if (!lines || lines.length === 0) return {};
        
        const result = {};
        let i = 0;
        
        while (i < lines.length) {
            const line = lines[i];
            const trimmed = line.trim();
            
            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith('#')) {
                i++;
                continue;
            }
            
            const indent = line.search(/\S/);
            const colonIndex = trimmed.indexOf(':');
            
            if (colonIndex > 0) {
                const key = trimmed.substring(0, colonIndex).trim();
                const afterColon = trimmed.substring(colonIndex + 1).trim();
                
                if (afterColon && !afterColon.startsWith('#')) {
                    // Inline value
                    result[key] = this.parseValue(afterColon);
                    i++;
                } else {
                    // Check next line for nested content or list
                    let nestedLines = [];
                    let j = i + 1;
                    
                    while (j < lines.length) {
                        const nextLine = lines[j];
                        const nextTrimmed = nextLine.trim();
                        
                        if (!nextTrimmed || nextTrimmed.startsWith('#')) {
                            j++;
                            continue;
                        }
                        
                        const nextIndent = nextLine.search(/\S/);
                        if (nextIndent <= indent) {
                            break;
                        }
                        
                        nestedLines.push(nextLine);
                        j++;
                    }
                    
                    if (nestedLines.length > 0) {
                        const firstNested = nestedLines[0].trim();
                        if (firstNested.startsWith('-')) {
                            // It's a list
                            result[key] = this.parseListLines(nestedLines);
                        } else {
                            // It's a nested object
                            result[key] = this.parseNestedContent(nestedLines);
                        }
                    } else {
                        result[key] = null;
                    }
                    
                    i = j;
                    continue;
                }
            } else if (trimmed.startsWith('-')) {
                // This shouldn't happen at this level, but handle it
                i++;
            } else {
                i++;
            }
        }
        
        return result;
    }
    
    /**
     * Parse list lines into an array
     */
    parseListLines(lines) {
        const list = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            
            if (trimmed.startsWith('-')) {
                let value = trimmed.substring(1).trim();
                if (value) {
                    list.push(value);
                }
            }
        }
        
        return list;
    }

    /**
     * Parse a single value
     */
    parseValue(value) {
        if (value === '' || value === null || value === undefined) return null;
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value === 'null' || value === '~') return null;
        
        // Try number
        if (/^-?\d+$/.test(value)) return parseInt(value, 10);
        if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
        
        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            return value.slice(1, -1);
        }
        
        return value;
    }

    /**
     * Find lines containing tabs
     */
    findTabLines(content) {
        const lines = content.split('\n');
        const tabLines = [];
        
        lines.forEach((line, index) => {
            if (line.includes('\t')) {
                tabLines.push(index + 1);
            }
        });

        return tabLines;
    }

    /**
     * Find the line range for an entry
     */
    findEntryLines(content, entryName) {
        const lines = content.split('\n');
        let start = -1;
        let end = -1;
        
        const entryPattern = new RegExp(`^${this.escapeRegex(entryName)}\\s*:`);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (start === -1) {
                if (entryPattern.test(line)) {
                    start = i + 1;
                }
            } else {
                // Check if this is a new top-level entry
                if (line.match(/^\S+\s*:/) && !line.startsWith(' ') && !line.startsWith('\t')) {
                    end = i;
                    break;
                }
            }
        }

        if (start !== -1 && end === -1) {
            end = lines.length;
        }

        return { start, end };
    }

    /**
     * Escape string for regex
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Parse YAML error and extract useful info
     */
    parseYamlError(error, content) {
        const errorInfo = {
            type: 'YAML_SYNTAX',
            line: 1,
            column: 1,
            message: error.message || 'Unknown YAML error',
            severity: 'critical',
            snippet: null,
            suggestion: ''
        };

        // Try to extract line number from error
        const lineMatch = error.message?.match(/line (\d+)/i);
        if (lineMatch) {
            errorInfo.line = parseInt(lineMatch[1], 10);
        }

        const colMatch = error.message?.match(/column (\d+)/i);
        if (colMatch) {
            errorInfo.column = parseInt(colMatch[1], 10);
        }

        // Generate snippet
        if (errorInfo.line > 0) {
            errorInfo.snippet = this.generateSnippet(content, errorInfo.line, errorInfo.column);
        }

        // Generate suggestion
        errorInfo.suggestion = this.generateSuggestion(error.message, content, errorInfo.line);

        return errorInfo;
    }

    /**
     * Generate code snippet around error line
     */
    generateSnippet(content, errorLine, errorColumn = 1) {
        const lines = content.split('\n');
        const contextLines = 3;
        
        const start = Math.max(0, errorLine - contextLines - 1);
        const end = Math.min(lines.length, errorLine + contextLines);

        const snippet = {
            before: [],
            errorLine: '',
            after: [],
            highlightColumn: errorColumn,
            startLineNumber: start + 1
        };

        for (let i = start; i < end; i++) {
            const lineNum = i + 1;
            const line = lines[i] || '';

            if (lineNum < errorLine) {
                snippet.before.push({ num: lineNum, text: line });
            } else if (lineNum === errorLine) {
                snippet.errorLine = { num: lineNum, text: line };
            } else {
                snippet.after.push({ num: lineNum, text: line });
            }
        }

        return snippet;
    }

    /**
     * Generate suggestion based on error type
     */
    generateSuggestion(errorMessage, content, line) {
        const msg = (errorMessage || '').toLowerCase();
        
        if (msg.includes('indent')) {
            return 'Check indentation - MythicMobs uses 2 spaces for each indent level';
        }
        if (msg.includes('duplicate')) {
            return 'Remove or rename one of the duplicate keys';
        }
        if (msg.includes('unexpected')) {
            return 'Check for missing colons, incorrect spacing, or invalid characters';
        }
        if (msg.includes('mapping')) {
            return 'Ensure proper key: value format with a space after the colon';
        }
        
        return 'Check YAML syntax - ensure proper indentation and formatting';
    }

    /**
     * Parse all files from a pack
     * @param {Object} pack Pack object from scanner
     * @param {Function} progressCallback Optional progress callback
     */
    async parsePackFiles(pack, progressCallback = null) {
        const results = {
            packName: pack.name,
            files: [],
            totalFiles: 0,
            successfulFiles: 0,
            failedFiles: 0,
            totalEntries: 0,
            totalErrors: 0,
            totalWarnings: 0
        };

        const folderTypes = ['Mobs', 'Skills', 'Items', 'DropTables', 'RandomSpawns'];
        let processedFiles = 0;
        let totalFiles = 0;

        // Count total files first
        for (const folderType of folderTypes) {
            const folder = pack.folders[folderType];
            if (folder && folder.exists) {
                totalFiles += this.countFilesInFolder(folder);
            }
        }
        
        // Add config files
        if (pack.configFiles.packinfo.exists) totalFiles++;
        if (pack.configFiles.tooltips.exists) totalFiles++;

        results.totalFiles = totalFiles;

        // Parse folder files
        for (const folderType of folderTypes) {
            const folder = pack.folders[folderType];
            if (!folder || !folder.exists) continue;

            const files = await this.parseFolderFiles(folder, folderType, folderType, (file) => {
                processedFiles++;
                if (progressCallback) {
                    progressCallback({
                        current: processedFiles,
                        total: totalFiles,
                        currentFile: file,
                        percentage: Math.round((processedFiles / totalFiles) * 100)
                    });
                }
            });

            results.files.push(...files);
        }

        // Parse config files
        if (pack.configFiles.packinfo.exists) {
            const result = await this.parseFile(
                pack.configFiles.packinfo.handle,
                'packinfo.yml',
                'config'
            );
            results.files.push(result);
            processedFiles++;
            if (progressCallback) {
                progressCallback({
                    current: processedFiles,
                    total: totalFiles,
                    currentFile: 'packinfo.yml',
                    percentage: Math.round((processedFiles / totalFiles) * 100)
                });
            }
        }

        if (pack.configFiles.tooltips.exists) {
            const result = await this.parseFile(
                pack.configFiles.tooltips.handle,
                'tooltips.yml',
                'config'
            );
            results.files.push(result);
            processedFiles++;
            if (progressCallback) {
                progressCallback({
                    current: processedFiles,
                    total: totalFiles,
                    currentFile: 'tooltips.yml',
                    percentage: Math.round((processedFiles / totalFiles) * 100)
                });
            }
        }

        // Calculate stats
        results.files.forEach(file => {
            if (file.success) {
                results.successfulFiles++;
            } else {
                results.failedFiles++;
            }
            results.totalEntries += file.entries.length;
            results.totalErrors += file.errors.length;
            results.totalWarnings += file.warnings.length;
        });

        return results;
    }

    /**
     * Count files in a folder structure
     */
    countFilesInFolder(folder) {
        let count = folder.files ? folder.files.length : 0;
        
        if (folder.subfolders) {
            for (const subfolder of folder.subfolders) {
                count += this.countFilesInFolder(subfolder);
            }
        }

        return count;
    }

    /**
     * Parse all files in a folder structure
     */
    async parseFolderFiles(folder, folderType, basePath, onFileProcessed) {
        const results = [];

        // Parse direct files
        for (const file of folder.files || []) {
            const relativePath = `${basePath}/${file.name}`;
            const result = await this.parseFile(file.handle, relativePath, folderType);
            results.push(result);
            if (onFileProcessed) onFileProcessed(relativePath);
        }

        // Parse subfolder files
        for (const subfolder of folder.subfolders || []) {
            const subResults = await this.parseFolderFiles(
                subfolder,
                folderType,
                `${basePath}/${subfolder.name}`,
                onFileProcessed
            );
            results.push(...subResults);
        }

        return results;
    }

    /**
     * Get all entries of a specific type from parsed files
     */
    getEntriesByType(parsedResults, folderType) {
        const entries = [];
        
        for (const file of parsedResults.files) {
            if (file.folderType === folderType && file.success) {
                for (const entry of file.entries) {
                    entries.push({
                        ...entry,
                        sourceFile: file.relativePath
                    });
                }
            }
        }

        return entries;
    }

    /**
     * Get all errors from parsed results
     */
    getAllErrors(parsedResults) {
        const errors = [];
        
        for (const file of parsedResults.files) {
            for (const error of file.errors) {
                errors.push({
                    ...error,
                    file: file.file,
                    relativePath: file.relativePath,
                    folderType: file.folderType
                });
            }
        }

        return errors;
    }

    /**
     * Get all warnings from parsed results
     */
    getAllWarnings(parsedResults) {
        const warnings = [];
        
        for (const file of parsedResults.files) {
            for (const warning of file.warnings) {
                warnings.push({
                    ...warning,
                    file: file.file,
                    relativePath: file.relativePath,
                    folderType: file.folderType
                });
            }
        }

        return warnings;
    }
}

window.YamlFileParser = YamlFileParser;
