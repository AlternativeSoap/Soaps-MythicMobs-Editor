/**
 * Smart Duplicate Detector
 * Advanced duplicate detection with fuzzy matching, context awareness, and extraction suggestions
 * 
 * Features:
 * - Fuzzy matching for similar skill lines (not just exact duplicates)
 * - Context-aware detection (ignores common patterns)
 * - Suggests extraction when 3+ skills use same pattern
 * - Whitelist for standard patterns
 * - Similarity scoring (0-100%)
 */
class SmartDuplicateDetector {
    constructor() {
        this.similarityThreshold = 90; // 90% similarity = potential duplicate
        this.extractionThreshold = 3;  // 3+ occurrences = suggest extraction
        
        // Common patterns that shouldn't be flagged as duplicates
        this.commonPatterns = [
            /^-\s*damage\{amount=\d+\}$/i,
            /^-\s*message\{/i,
            /^-\s*sound\{/i,
            /^-\s*effect:particles\{/i,
            /^-\s*delay\s+\d+$/i,
            /^-\s*heal\{amount=\d+\}$/i,
            /^-\s*velocity\{/i,
            /^-\s*setHealth\{/i,
            /^-\s*effect:potion\{type=/i
        ];
        
        // Track patterns across skills for extraction suggestions
        this.patternOccurrences = new Map(); // normalized pattern -> [{ skillName, lineIndex, originalLine }]
    }
    
    /**
     * Detect duplicates and similar lines in a skill
     */
    detectInSkill(skillLines) {
        const duplicates = [];
        const similar = [];
        
        for (let i = 0; i < skillLines.length; i++) {
            const line = skillLines[i];
            
            // Skip if common pattern
            if (this.isCommonPattern(line)) {
                continue;
            }
            
            // Check for exact duplicates
            for (let j = i + 1; j < skillLines.length; j++) {
                const otherLine = skillLines[j];
                
                if (this.normalizeSkillLine(line) === this.normalizeSkillLine(otherLine)) {
                    duplicates.push({
                        type: 'exact',
                        line1: i,
                        line2: j,
                        content: line,
                        similarity: 100
                    });
                }
            }
            
            // Check for similar lines (fuzzy match)
            for (let j = i + 1; j < skillLines.length; j++) {
                const otherLine = skillLines[j];
                const similarity = this.calculateSimilarity(line, otherLine);
                
                if (similarity >= this.similarityThreshold && similarity < 100) {
                    similar.push({
                        type: 'similar',
                        line1: i,
                        line2: j,
                        content1: line,
                        content2: otherLine,
                        similarity: similarity
                    });
                }
            }
        }
        
        return { duplicates, similar };
    }
    
    /**
     * Detect patterns across multiple skills (for extraction suggestions)
     */
    detectCrossSkillPatterns(skills) {
        this.patternOccurrences.clear();
        
        // Track all patterns
        for (const skill of skills) {
            const skillName = skill.internalName || skill.name;
            const lines = skill.content?.split('\n') || [];
            
            lines.forEach((line, index) => {
                if (this.isCommonPattern(line)) {
                    return;
                }
                
                const normalized = this.normalizeSkillLine(line);
                if (!normalized) return;
                
                if (!this.patternOccurrences.has(normalized)) {
                    this.patternOccurrences.set(normalized, []);
                }
                
                this.patternOccurrences.get(normalized).push({
                    skillName,
                    lineIndex: index,
                    originalLine: line.trim()
                });
            });
        }
        
        // Find patterns that appear in multiple skills
        const extractionSuggestions = [];
        
        for (const [pattern, occurrences] of this.patternOccurrences.entries()) {
            if (occurrences.length >= this.extractionThreshold) {
                // Group by skill
                const skillsUsing = new Set(occurrences.map(o => o.skillName));
                
                if (skillsUsing.size >= this.extractionThreshold) {
                    extractionSuggestions.push({
                        pattern: occurrences[0].originalLine,
                        occurrences: occurrences.length,
                        skillsUsing: Array.from(skillsUsing),
                        locations: occurrences,
                        suggestion: this.generateExtractionSuggestion(pattern, occurrences)
                    });
                }
            }
        }
        
        return extractionSuggestions;
    }
    
    /**
     * Calculate similarity between two skill lines (0-100)
     */
    calculateSimilarity(line1, line2) {
        const norm1 = this.normalizeSkillLine(line1);
        const norm2 = this.normalizeSkillLine(line2);
        
        if (!norm1 || !norm2) return 0;
        
        // Use Levenshtein distance for similarity
        const distance = this.levenshteinDistance(norm1, norm2);
        const maxLength = Math.max(norm1.length, norm2.length);
        
        if (maxLength === 0) return 100;
        
        const similarity = ((maxLength - distance) / maxLength) * 100;
        return Math.round(similarity);
    }
    
    /**
     * Levenshtein distance algorithm
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    /**
     * Normalize skill line for comparison
     */
    normalizeSkillLine(line) {
        if (!line) return '';
        
        // Remove leading dash and whitespace
        let normalized = line.trim().replace(/^-\s*/, '');
        
        // Convert to lowercase
        normalized = normalized.toLowerCase();
        
        // Normalize common numeric values (but preserve structure)
        // Don't normalize numbers completely, just standardize spacing
        normalized = normalized.replace(/\s+/g, ' ');
        
        // Normalize quotes
        normalized = normalized.replace(/["']/g, '"');
        
        return normalized;
    }
    
    /**
     * Check if line matches common pattern whitelist
     */
    isCommonPattern(line) {
        const normalized = line.trim();
        
        for (const pattern of this.commonPatterns) {
            if (pattern.test(normalized)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Generate extraction suggestion message
     */
    generateExtractionSuggestion(pattern, occurrences) {
        const skillCount = new Set(occurrences.map(o => o.skillName)).size;
        const suggestedName = this.generateSubSkillName(pattern);
        
        return {
            message: `This pattern appears in ${skillCount} different skills (${occurrences.length} times total)`,
            recommendation: `Consider creating a reusable sub-skill called "${suggestedName}"`,
            example: `Create a skill:\n${suggestedName}:\n  Skills:\n  ${pattern}\n\nThen replace occurrences with:\n  - skill{s=${suggestedName}}`
        };
    }
    
    /**
     * Generate a suggested sub-skill name based on pattern
     */
    generateSubSkillName(pattern) {
        // Extract mechanic name
        const mechanicMatch = pattern.match(/(\w+)\{/);
        if (mechanicMatch) {
            const mechanic = mechanicMatch[1];
            return `Common${mechanic.charAt(0).toUpperCase() + mechanic.slice(1)}`;
        }
        
        return 'CommonPattern';
    }
    
    /**
     * Add custom pattern to whitelist
     */
    addToWhitelist(pattern) {
        if (typeof pattern === 'string') {
            this.commonPatterns.push(new RegExp(pattern, 'i'));
        } else if (pattern instanceof RegExp) {
            this.commonPatterns.push(pattern);
        }
    }
    
    /**
     * Remove pattern from whitelist
     */
    removeFromWhitelist(index) {
        if (index >= 0 && index < this.commonPatterns.length) {
            this.commonPatterns.splice(index, 1);
        }
    }
    
    /**
     * Get whitelist patterns
     */
    getWhitelist() {
        return this.commonPatterns.map(p => p.toString());
    }
    
    /**
     * Set similarity threshold
     */
    setSimilarityThreshold(threshold) {
        if (threshold >= 0 && threshold <= 100) {
            this.similarityThreshold = threshold;
        }
    }
    
    /**
     * Set extraction threshold
     */
    setExtractionThreshold(threshold) {
        if (threshold >= 1) {
            this.extractionThreshold = threshold;
        }
    }
    
    /**
     * Get configuration
     */
    getConfig() {
        return {
            similarityThreshold: this.similarityThreshold,
            extractionThreshold: this.extractionThreshold,
            whitelistSize: this.commonPatterns.length
        };
    }
}

// Loaded silently
