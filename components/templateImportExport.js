/**
 * Template Import/Export Utility
 * Handles exporting templates to YAML format and importing YAML templates
 */

class TemplateImportExport {
    constructor(templateManager) {
        this.templateManager = templateManager;
    }
    
    /**
     * Export template to YAML format
     * @param {Object} template - Template object
     * @returns {string} YAML string
     */
    exportToYAML(template) {
        const lines = [];
        
        // Header comment
        lines.push(`# MythicMobs Editor Template Export`);
        lines.push(`# Template: ${template.name}`);
        lines.push(`# Description: ${template.description}`);
        lines.push(`# Type: ${template.type}`);
        lines.push(`# Structure: ${template.structure_type || 'multi-line'} (${template.structureInfo?.sectionCount || 1} section(s), ${template.structureInfo?.lineCount || 0} line(s))`);
        if (template.isOfficial) {
            lines.push(`# Official Template`);
        }
        lines.push(`# Created: ${new Date(template.created_at).toLocaleDateString()}`);
        lines.push(``);
        
        // Metadata section
        lines.push(`# --- Template Metadata ---`);
        lines.push(`# Category: ${template.category}`);
        lines.push(`# Difficulty: ${template.difficulty}`);
        lines.push(`# Icon: ${template.icon}`);
        if (template.tags && template.tags.length > 0) {
            lines.push(`# Tags: ${template.tags.join(', ')}`);
        }
        if (template.triggers && template.triggers.length > 0) {
            lines.push(`# Triggers: ${template.triggers.join(', ')}`);
        }
        lines.push(``);
        
        // Skill sections
        const sections = template.sections || [{
            name: 'DefaultSkill',
            lines: template.skillLines || []
        }];
        
        sections.forEach((section, index) => {
            // Section header
            if (sections.length > 1) {
                lines.push(`# --- Section ${index + 1}: ${section.name} ---`);
            }
            
            // Section name (YAML key)
            lines.push(`${section.name}:`);
            
            // Skill lines with proper indentation
            lines.push(`  Skills:`);
            (section.lines || []).forEach(line => {
                // Ensure line starts with dash and indent properly
                const cleanLine = line.trim();
                lines.push(`    ${cleanLine.startsWith('-') ? cleanLine : '- ' + cleanLine}`);
            });
            
            // Add spacing between sections
            if (index < sections.length - 1) {
                lines.push(``);
            }
        });
        
        return lines.join('\n');
    }
    
    /**
     * Import template from YAML format
     * @param {string} yaml - YAML string
     * @returns {Object} Template data object
     */
    importFromYAML(yaml) {
        try {
            const lines = yaml.split('\n');
            const template = {
                name: '',
                description: '',
                type: 'skill',
                sections: [],
                tags: [],
                category: 'utility',
                difficulty: 'easy',
                icon: '📦',
                is_official: false
            };
            
            let currentSection = null;
            let inSkillsBlock = false;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // Skip empty lines
                if (!line) continue;
                
                // Parse metadata from comments
                if (line.startsWith('#')) {
                    const comment = line.substring(1).trim();
                    
                    if (comment.startsWith('Template:')) {
                        template.name = comment.substring(9).trim();
                    } else if (comment.startsWith('Description:')) {
                        template.description = comment.substring(12).trim();
                    } else if (comment.startsWith('Type:')) {
                        template.type = comment.substring(5).trim();
                    } else if (comment.startsWith('Category:')) {
                        template.category = comment.substring(9).trim();
                    } else if (comment.startsWith('Difficulty:')) {
                        template.difficulty = comment.substring(11).trim();
                    } else if (comment.startsWith('Icon:')) {
                        template.icon = comment.substring(5).trim();
                    } else if (comment.startsWith('Tags:')) {
                        template.tags = comment.substring(5).split(',').map(t => t.trim()).filter(t => t);
                    } else if (comment.includes('Official Template')) {
                        template.is_official = true;
                    }
                    continue;
                }
                
                // Detect section name (YAML key without colon at end of line)
                if (line.endsWith(':') && !line.startsWith('-') && line.indexOf('  ') !== 0) {
                    const sectionName = line.substring(0, line.length - 1).trim();
                    
                    // Check if this is a Skills: block
                    if (sectionName === 'Skills') {
                        inSkillsBlock = true;
                        continue;
                    }
                    
                    // New section
                    currentSection = {
                        name: sectionName,
                        lines: []
                    };
                    template.sections.push(currentSection);
                    inSkillsBlock = false;
                    continue;
                }
                
                // Parse skill lines (indented lines starting with -)
                if (line.startsWith('-') || (line.match(/^\s+/) && line.includes('-'))) {
                    if (currentSection && inSkillsBlock) {
                        // Clean and add the skill line
                        const skillLine = line.trim();
                        currentSection.lines.push(skillLine);
                    }
                }
            }
            
            // Validation
            if (!template.name) {
                throw new Error('Template name not found in YAML');
            }
            if (!template.description) {
                throw new Error('Template description not found in YAML');
            }
            if (template.sections.length === 0) {
                throw new Error('No skill sections found in YAML');
            }
            
            // Set skillLines for backward compatibility
            template.skillLines = template.sections.length === 1 
                ? template.sections[0].lines 
                : template.sections.flatMap(s => s.lines);
            
            return template;
            
        } catch (error) {
            console.error('Failed to import YAML:', error);
            throw new Error(`Failed to parse YAML: ${error.message}`);
        }
    }
    
    /**
     * Download template as YAML file
     * @param {Object} template - Template object
     */
    downloadAsYAML(template) {
        try {
            const yaml = this.exportToYAML(template);
            const filename = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_template.yml`;
            
            const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            return true;
            
        } catch (error) {
            console.error('Failed to download YAML:', error);
            throw error;
        }
    }
    
    /**
     * Open file picker to import YAML template
     * @param {Function} onSuccess - Callback with imported template data
     * @param {Function} onError - Error callback
     */
    async importFromFile(onSuccess, onError) {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.yml,.yaml,.txt';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                try {
                    const text = await file.text();
                    const templateData = this.importFromYAML(text);
                    
                    if (onSuccess) {
                        onSuccess(templateData);
                    }
                } catch (error) {
                    console.error('Failed to import file:', error);
                    if (onError) {
                        onError(error);
                    }
                }
            };
            
            input.click();
            
        } catch (error) {
            console.error('Failed to open file picker:', error);
            if (onError) {
                onError(error);
            }
        }
    }
    
    /**
     * Copy template YAML to clipboard
     * @param {Object} template - Template object
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(template) {
        try {
            const yaml = this.exportToYAML(template);
            await navigator.clipboard.writeText(yaml);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            throw error;
        }
    }
    
    /**
     * Import template from clipboard
     * @returns {Promise<Object>} Imported template data
     */
    async importFromClipboard() {
        try {
            const yaml = await navigator.clipboard.readText();
            const templateData = this.importFromYAML(yaml);
            return templateData;
        } catch (error) {
            console.error('Failed to import from clipboard:', error);
            throw error;
        }
    }
}

// Export for use in other modules
window.TemplateImportExport = TemplateImportExport;
