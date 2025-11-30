/**
 * SkillLineDuplicateDetector - Detect duplicate and similar skill lines
 * 
 * Features:
 * - Calculate similarity between skill lines
 * - Find exact duplicates
 * - Group similar mechanics
 * - Suggest merge opportunities
 * - Highlight redundant mechanics
 */

class SkillLineDuplicateDetector {
    constructor() {
        this.similarityThreshold = 0.75; // 75% similarity to be considered "similar"
        this.duplicates = [];
        this.similarGroups = [];
        
        // Mechanics that are commonly repeated and should not be flagged as duplicates
        this.excludedMechanics = ['delay', 'wait', 'pause'];
    }
    
    /**
     * Check if a skill line uses an excluded mechanic
     * @param {string} line - Skill line to check
     * @returns {boolean} True if the mechanic should be excluded from duplicate detection
     */
    isExcludedMechanic(line) {
        const parsed = this.parseSkillLine(line);
        return this.excludedMechanics.includes(parsed.mechanic.toLowerCase());
    }
    
    /**
     * Analyze skill lines for duplicates and similarities
     * @param {Array} skillLines - Array of skill line strings
     * @returns {Object} Analysis results
     */
    analyze(skillLines) {
        if (!skillLines || skillLines.length === 0) {
            return {
                duplicates: [],
                similarGroups: [],
                summary: {
                    totalLines: 0,
                    exactDuplicates: 0,
                    similarGroups: 0,
                    potentialSavings: 0
                }
            };
        }
        
        // Find exact duplicates
        this.duplicates = this.findExactDuplicates(skillLines);
        
        // Find similar mechanics
        this.similarGroups = this.findSimilarMechanics(skillLines);
        
        // Calculate potential savings
        const potentialSavings = this.calculateSavings(this.duplicates, this.similarGroups);
        
        return {
            duplicates: this.duplicates,
            similarGroups: this.similarGroups,
            summary: {
                totalLines: skillLines.length,
                exactDuplicates: this.duplicates.length,
                similarGroups: this.similarGroups.length,
                potentialSavings: potentialSavings
            }
        };
    }
    
    /**
     * Find exact duplicate lines
     * @param {Array} skillLines - Array of skill lines
     * @returns {Array} Duplicate groups
     */
    findExactDuplicates(skillLines) {
        const duplicates = [];
        const seen = new Map();
        
        skillLines.forEach((line, index) => {
            const normalized = this.normalizeLine(line);
            
            if (seen.has(normalized)) {
                // Found a duplicate
                const group = seen.get(normalized);
                group.indices.push(index);
            } else {
                // First occurrence
                seen.set(normalized, {
                    line: line,
                    normalized: normalized,
                    indices: [index]
                });
            }
        });
        
        // Filter to only groups with duplicates (excluding allowed repeated mechanics)
        seen.forEach((group) => {
            if (group.indices.length > 1 && !this.isExcludedMechanic(group.line)) {
                duplicates.push({
                    type: 'exact',
                    line: group.line,
                    indices: group.indices,
                    count: group.indices.length,
                    similarity: 1.0,
                    suggestion: `This line appears ${group.indices.length} times. Consider using a metaskill or variable.`,
                    severity: 'warning'
                });
            }
        });
        
        return duplicates;
    }
    
    /**
     * Find similar mechanics that could be consolidated
     * @param {Array} skillLines - Array of skill lines
     * @returns {Array} Similar groups
     */
    findSimilarMechanics(skillLines) {
        const similarGroups = [];
        const compared = new Set();
        
        for (let i = 0; i < skillLines.length; i++) {
            if (compared.has(i)) continue;
            
            // Skip excluded mechanics (like delay) from similarity detection
            if (this.isExcludedMechanic(skillLines[i])) continue;
            
            const group = {
                type: 'similar',
                baseIndex: i,
                baseLine: skillLines[i],
                similarLines: [],
                averageSimilarity: 0,
                suggestion: '',
                severity: 'info'
            };
            
            for (let j = i + 1; j < skillLines.length; j++) {
                if (compared.has(j)) continue;
                
                const similarity = this.calculateSimilarity(skillLines[i], skillLines[j]);
                
                if (similarity >= this.similarityThreshold && similarity < 1.0) {
                    group.similarLines.push({
                        index: j,
                        line: skillLines[j],
                        similarity: similarity,
                        differences: this.findDifferences(skillLines[i], skillLines[j])
                    });
                    compared.add(j);
                }
            }
            
            // Only include groups with similar lines
            if (group.similarLines.length > 0) {
                compared.add(i);
                
                // Calculate average similarity
                const totalSimilarity = group.similarLines.reduce((sum, item) => sum + item.similarity, 0);
                group.averageSimilarity = totalSimilarity / group.similarLines.length;
                
                // Generate suggestion
                const diffCount = group.similarLines.length + 1;
                group.suggestion = `${diffCount} similar lines detected (${Math.round(group.averageSimilarity * 100)}% similar). Consider creating a metaskill with variations.`;
                
                // Set severity based on similarity
                if (group.averageSimilarity >= 0.9) {
                    group.severity = 'warning';
                } else {
                    group.severity = 'info';
                }
                
                similarGroups.push(group);
            }
        }
        
        return similarGroups;
    }
    
    /**
     * Calculate similarity between two skill lines
     * @param {string} line1 - First line
     * @param {string} line2 - Second line
     * @returns {number} Similarity score (0-1)
     */
    calculateSimilarity(line1, line2) {
        const parsed1 = this.parseSkillLine(line1);
        const parsed2 = this.parseSkillLine(line2);
        
        let score = 0;
        let factors = 0;
        
        // Compare mechanic name (most important)
        if (parsed1.mechanic === parsed2.mechanic) {
            score += 3;
        }
        factors += 3;
        
        // Compare attributes
        const attrs1 = Object.keys(parsed1.attributes);
        const attrs2 = Object.keys(parsed2.attributes);
        const allAttrs = new Set([...attrs1, ...attrs2]);
        
        allAttrs.forEach(attr => {
            factors++;
            
            if (parsed1.attributes[attr] && parsed2.attributes[attr]) {
                // Both have the attribute
                if (parsed1.attributes[attr] === parsed2.attributes[attr]) {
                    // Same value
                    score += 1;
                } else {
                    // Different value (partial credit)
                    score += 0.3;
                }
            }
        });
        
        // Compare targeter
        if (parsed1.targeter && parsed2.targeter) {
            factors++;
            if (parsed1.targeter === parsed2.targeter) {
                score += 1;
            } else {
                score += 0.3;
            }
        }
        
        // Compare trigger
        if (parsed1.trigger && parsed2.trigger) {
            factors++;
            if (parsed1.trigger === parsed2.trigger) {
                score += 1;
            } else {
                score += 0.3;
            }
        }
        
        return factors > 0 ? score / factors : 0;
    }
    
    /**
     * Find specific differences between two lines
     * @param {string} line1 - First line
     * @param {string} line2 - Second line
     * @returns {Array} List of differences
     */
    findDifferences(line1, line2) {
        const parsed1 = this.parseSkillLine(line1);
        const parsed2 = this.parseSkillLine(line2);
        const differences = [];
        
        // Check mechanic
        if (parsed1.mechanic !== parsed2.mechanic) {
            differences.push({
                type: 'mechanic',
                value1: parsed1.mechanic,
                value2: parsed2.mechanic
            });
        }
        
        // Check attributes
        const allAttrs = new Set([
            ...Object.keys(parsed1.attributes),
            ...Object.keys(parsed2.attributes)
        ]);
        
        allAttrs.forEach(attr => {
            const val1 = parsed1.attributes[attr];
            const val2 = parsed2.attributes[attr];
            
            if (val1 !== val2) {
                differences.push({
                    type: 'attribute',
                    attribute: attr,
                    value1: val1 || '(missing)',
                    value2: val2 || '(missing)'
                });
            }
        });
        
        // Check targeter
        if (parsed1.targeter !== parsed2.targeter) {
            differences.push({
                type: 'targeter',
                value1: parsed1.targeter,
                value2: parsed2.targeter
            });
        }
        
        // Check trigger
        if (parsed1.trigger !== parsed2.trigger) {
            differences.push({
                type: 'trigger',
                value1: parsed1.trigger,
                value2: parsed2.trigger
            });
        }
        
        return differences;
    }
    
    /**
     * Parse a skill line into components
     * @param {string} line - Skill line to parse
     * @returns {Object} Parsed components
     */
    parseSkillLine(line) {
        const result = {
            mechanic: '',
            attributes: {},
            targeter: '',
            trigger: ''
        };
        
        // Extract mechanic and attributes: - mechanic{attrs}
        const mechanicMatch = line.match(/^-\s*([^\s{]+)(?:\{([^}]*)\})?/);
        if (mechanicMatch) {
            result.mechanic = mechanicMatch[1];
            
            if (mechanicMatch[2]) {
                // Parse attributes
                mechanicMatch[2].split(';').forEach(attr => {
                    const [key, value] = attr.split('=').map(s => s.trim());
                    if (key && value) {
                        result.attributes[key] = value;
                    }
                });
            }
        }
        
        // Extract targeter: @targeter
        const targeterMatch = line.match(/@([^\s~?]+)/);
        if (targeterMatch) {
            result.targeter = targeterMatch[1];
        }
        
        // Extract trigger: ~trigger
        const triggerMatch = line.match(/~([^\s?]+)/);
        if (triggerMatch) {
            result.trigger = triggerMatch[1];
        }
        
        return result;
    }
    
    /**
     * Normalize a line for exact comparison
     * @param {string} line - Line to normalize
     * @returns {string} Normalized line
     */
    normalizeLine(line) {
        return line
            .trim()
            .replace(/\s+/g, ' ') // Multiple spaces to single space
            .replace(/\s*=\s*/g, '=') // Remove spaces around equals
            .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
            .replace(/\s*@/g, '@') // Remove spaces before targeter
            .replace(/\s*~/g, '~') // Remove spaces before trigger
            .replace(/\s*\?/g, '?') // Remove spaces before condition
            .toLowerCase();
    }
    
    /**
     * Calculate potential line savings
     * @param {Array} duplicates - Duplicate groups
     * @param {Array} similarGroups - Similar groups
     * @returns {number} Number of lines that could be saved
     */
    calculateSavings(duplicates, similarGroups) {
        let savings = 0;
        
        // Exact duplicates: can save count - 1 lines per group
        duplicates.forEach(group => {
            savings += group.count - 1;
        });
        
        // Similar mechanics: could save ~50% of lines in each group
        similarGroups.forEach(group => {
            const totalLines = group.similarLines.length + 1;
            savings += Math.floor(totalLines * 0.5);
        });
        
        return savings;
    }
    
    /**
     * Get suggestions for consolidating duplicates
     * @param {Object} duplicate - Duplicate group
     * @returns {Array} Consolidation suggestions
     */
    getConsolidationSuggestions(duplicate) {
        const suggestions = [];
        
        if (duplicate.type === 'exact') {
            suggestions.push({
                method: 'metaskill',
                description: 'Create a metaskill and reference it',
                example: `Create a metaskill:\n  MyMetaskill:\n    ${duplicate.line}\n\nThen use: - skill{s=MyMetaskill}`,
                benefit: `Reduces ${duplicate.count} lines to 1 metaskill + ${duplicate.count} references`
            });
            
            suggestions.push({
                method: 'variable',
                description: 'Use a variable placeholder',
                example: 'Use placeholders like <caster.var.skillname> to reuse the same logic',
                benefit: 'Allows dynamic skill behavior'
            });
        } else if (duplicate.type === 'similar') {
            suggestions.push({
                method: 'parameterized-metaskill',
                description: 'Create a metaskill with parameters',
                example: 'Use placeholders for differences and pass them via skill variables',
                benefit: `Consolidates ${duplicate.similarLines.length + 1} similar lines`
            });
            
            suggestions.push({
                method: 'conditions',
                description: 'Use conditions to handle variations',
                example: 'Use ?condition to branch behavior within a single line',
                benefit: 'Reduces code duplication while maintaining different behaviors'
            });
        }
        
        return suggestions;
    }
    
    /**
     * Update similarity threshold
     * @param {number} threshold - New threshold (0-1)
     */
    setSimilarityThreshold(threshold) {
        this.similarityThreshold = Math.max(0, Math.min(1, threshold));
    }
    
    /**
     * Get summary statistics
     * @returns {Object} Summary stats
     */
    getSummary() {
        return {
            exactDuplicates: this.duplicates.length,
            similarGroups: this.similarGroups.length,
            potentialSavings: this.calculateSavings(this.duplicates, this.similarGroups)
        };
    }
}

// Create global instance
window.SkillLineDuplicateDetector = SkillLineDuplicateDetector;
