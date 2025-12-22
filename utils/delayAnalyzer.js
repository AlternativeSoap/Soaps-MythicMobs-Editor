/**
 * Delay Analyzer Utility
 * Tracks and calculates cumulative delays in skill lines
 * Supports both tick and second display modes
 */

class DelayAnalyzer {
    /**
     * Analyze skill lines and calculate delay information
     * @param {Array<string>} skillLines - Array of skill line strings
     * @param {string} displayMode - 'ticks' or 'seconds'
     * @returns {Array<Object>} Array of delay info objects
     */
    static analyzeDelaySequence(skillLines, displayMode = 'ticks') {
        if (!Array.isArray(skillLines)) return [];
        
        let cumulativeDelay = 0;
        const delayInfo = [];
        
        skillLines.forEach((line, index) => {
            const lineDelay = this.extractDelayFromLine(line);
            
            if (lineDelay > 0) {
                cumulativeDelay += lineDelay;
                delayInfo.push({
                    lineIndex: index,
                    delay: lineDelay,
                    cumulativeDelay: cumulativeDelay,
                    displayText: this.formatDelayText(lineDelay, cumulativeDelay, displayMode)
                });
            } else {
                delayInfo.push({
                    lineIndex: index,
                    delay: 0,
                    cumulativeDelay: cumulativeDelay,
                    displayText: null
                });
            }
        });
        
        return delayInfo;
    }
    
    /**
     * Extract delay value from a skill line
     * @param {string} line - Skill line string
     * @returns {number} Delay in ticks (0 if no delay)
     */
    static extractDelayFromLine(line) {
        if (!line || typeof line !== 'string') return 0;
        
        // Match delay mechanic: - delay{ticks=100} or - delay 100
        const patterns = [
            /^[\s-]*delay\{[^}]*ticks=(\d+)/i,  // delay{ticks=100}
            /^[\s-]*delay\{[^}]*t=(\d+)/i,      // delay{t=100}
            /^[\s-]*delay[\s{]+(\d+)/i          // delay 100 or delay{100}
        ];
        
        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match && match[1]) {
                return parseInt(match[1], 10);
            }
        }
        
        return 0;
    }
    
    /**
     * Format delay text for display
     * @param {number} delay - Individual delay in ticks
     * @param {number} cumulative - Cumulative delay in ticks
     * @param {string} mode - 'ticks' or 'seconds'
     * @returns {string} Formatted display text
     */
    static formatDelayText(delay, cumulative, mode = 'ticks') {
        if (mode === 'seconds') {
            const delaySeconds = this.ticksToSeconds(delay);
            const cumulativeSeconds = this.ticksToSeconds(cumulative);
            
            // Show both if they're different
            if (delay === cumulative) {
                return `${delaySeconds} Second${delaySeconds !== 1 ? 's' : ''}`;
            } else {
                return `${delaySeconds} Second${delaySeconds !== 1 ? 's' : ''} - Total ${cumulativeSeconds} Second${cumulativeSeconds !== 1 ? 's' : ''}`;
            }
        } else {
            // Ticks mode
            if (delay === cumulative) {
                return `${delay} Tick${delay !== 1 ? 's' : ''}`;
            } else {
                return `${delay} Tick${delay !== 1 ? 's' : ''} - Total ${cumulative} Tick${cumulative !== 1 ? 's' : ''}`;
            }
        }
    }
    
    /**
     * Convert ticks to seconds (20 ticks = 1 second in Minecraft)
     * @param {number} ticks - Number of ticks
     * @returns {number} Seconds (rounded to 1 decimal)
     */
    static ticksToSeconds(ticks) {
        return Math.round((ticks / 20) * 10) / 10;
    }
    
    /**
     * Get delay info for a specific line index
     * @param {Array<Object>} delayInfoArray - Array from analyzeDelaySequence
     * @param {number} lineIndex - Index of the line
     * @returns {Object|null} Delay info object or null
     */
    static getDelayInfoForLine(delayInfoArray, lineIndex) {
        if (!Array.isArray(delayInfoArray) || lineIndex < 0 || lineIndex >= delayInfoArray.length) {
            return null;
        }
        return delayInfoArray[lineIndex];
    }
    
    /**
     * Check if a line contains a delay mechanic
     * @param {string} line - Skill line string
     * @returns {boolean} True if line has delay
     */
    static hasDelay(line) {
        return this.extractDelayFromLine(line) > 0;
    }
    
    /**
     * Get total delay for entire skill
     * @param {Array<string>} skillLines - Array of skill line strings
     * @returns {number} Total delay in ticks
     */
    static getTotalDelay(skillLines) {
        if (!Array.isArray(skillLines)) return 0;
        
        return skillLines.reduce((total, line) => {
            return total + this.extractDelayFromLine(line);
        }, 0);
    }
}

// Make globally available
window.DelayAnalyzer = DelayAnalyzer;
