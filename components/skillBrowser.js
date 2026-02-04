/**
 * Skill Browser Component
 * Browse and select skills from the current pack
 * Used for mechanics that reference other skills (onStart, onTick, onEnd, onHit, etc.)
 */

class SkillBrowser {
    constructor() {
        this.ensureModal();
        this.attachEventListeners();
        this.currentCallback = null;
        this.skills = [];
    }

    /**
     * Ensure the modal exists (create if missing, reuse if exists)
     */
    ensureModal() {
        // Check if modal already exists
        if (document.getElementById('skillBrowserOverlay')) {
            return; // Reuse existing modal
        }
        this.createModal();
    }

    /**
     * Create the skill browser modal
     */
    createModal() {
        const modalHTML = `
            <div id="skillBrowserOverlay" class="condition-modal" style="display: none; z-index: 10001;">
                <div class="modal-content condition-browser" style="max-width: 800px; max-height: 85vh;">
                    <!-- Header -->
                    <div class="modal-header">
                        <h2>
                            <i class="fas fa-magic"></i>
                            Browse Skills
                        </h2>
                        <button class="btn-close" id="skillBrowserClose" title="Close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <!-- Search -->
                    <div style="padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color);">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" id="skillBrowserSearch" placeholder="Search skills..." autocomplete="off">
                        </div>
                        <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem; align-items: center;">
                            <span style="font-size: 0.85rem; color: var(--text-secondary);">
                                <i class="fas fa-info-circle"></i>
                                <span id="skillBrowserCount">0 skills available</span>
                            </span>
                        </div>
                    </div>
                    
                    <!-- Skills List -->
                    <div class="condition-browser-body" style="padding: 1.5rem; overflow-y: auto; max-height: 500px;">
                        <div id="skillBrowserList" class="browser-list">
                            <!-- Skills will be populated here -->
                        </div>
                        <div id="skillBrowserEmpty" class="empty-state" style="display: none;">
                            <i class="fas fa-magic" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                            <p>No skills found in current pack</p>
                            <small style="color: var(--text-tertiary);">Create skills in the Skill Editor first</small>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="skillBrowserCloseBtn">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        const temp = document.createElement('div');
        temp.innerHTML = modalHTML;
        document.body.appendChild(temp.firstElementChild);
    }

    /**
     * Attach event listeners (only if not already attached)
     */
    attachEventListeners() {
        const overlay = document.getElementById('skillBrowserOverlay');
        if (!overlay) return;
        
        // Check if already attached
        if (overlay.dataset.listenersAttached) {
            return;
        }
        overlay.dataset.listenersAttached = 'true';
        
        const closeBtn = document.getElementById('skillBrowserClose');
        const closeFooterBtn = document.getElementById('skillBrowserCloseBtn');
        const searchInput = document.getElementById('skillBrowserSearch');

        let skillBrowserTouchHandled = false;
        if (closeBtn) {
            closeBtn.addEventListener('touchstart', (e) => {
                skillBrowserTouchHandled = true;
                setTimeout(() => skillBrowserTouchHandled = false, 500);
            }, { passive: false });
            closeBtn.addEventListener('click', () => {
                if (skillBrowserTouchHandled) return;
                this.close();
            });
        }
        
        if (closeFooterBtn) {
            closeFooterBtn.addEventListener('touchstart', (e) => {
                skillBrowserTouchHandled = true;
                setTimeout(() => skillBrowserTouchHandled = false, 500);
            }, { passive: false });
            closeFooterBtn.addEventListener('click', () => {
                if (skillBrowserTouchHandled) return;
                this.close();
            });
        }
        
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.style.display !== 'none') {
                this.close();
            }
        });

        // Search functionality
        searchInput?.addEventListener('input', (e) => {
            this.filterSkills(e.target.value);
        });

        // Close on overlay click
        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });
    }

    /**
     * Open the skill browser
     * @param {Function} onSelect - Callback when skill is selected, receives skill name
     * @param {Object} options - Additional options
     */
    open(onSelect, options = {}) {
        this.currentCallback = onSelect;
        this.skills = this.loadSkills();
        
        const overlay = document.getElementById('skillBrowserOverlay');
        const searchInput = document.getElementById('skillBrowserSearch');
        
        if (overlay) {
            overlay.style.display = 'flex';
            this.renderSkills();
            
            // Focus search input
            setTimeout(() => searchInput?.focus(), 100);
        }
    }

    /**
     * Close the skill browser
     */
    close() {
        const overlay = document.getElementById('skillBrowserOverlay');
        const searchInput = document.getElementById('skillBrowserSearch');
        
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        if (searchInput) {
            searchInput.value = '';
        }
        
        this.currentCallback = null;
    }

    /**
     * Load skills from current pack
     * @returns {Array<Object>} Array of skill objects
     */
    loadSkills() {
        const skills = [];
        
        // Get current pack from editor
        const editor = window.editor;
        if (!editor || !editor.state.currentPack) {
            return skills;
        }
        
        const pack = editor.state.currentPack;
        
        // Load skills from pack
        if (pack.skills && Array.isArray(pack.skills)) {
            pack.skills.forEach(skillFile => {
                // Each skill file contains multiple skills
                if (skillFile.skills && typeof skillFile.skills === 'object') {
                    Object.keys(skillFile.skills).forEach(skillName => {
                        const skillData = skillFile.skills[skillName];
                        skills.push({
                            name: skillName,
                            file: skillFile.name,
                            lineCount: skillData.lines ? skillData.lines.length : 0,
                            hasConditions: !!(skillData.Conditions || skillData.TargetConditions),
                            hasCooldown: !!skillData.cooldown
                        });
                    });
                } else if (skillFile.Skills && Array.isArray(skillFile.Skills)) {
                    // Old format support
                    skills.push({
                        name: skillFile.name,
                        file: skillFile._fileName || 'unknown',
                        lineCount: skillFile.Skills.length,
                        hasConditions: !!(skillFile.Conditions || skillFile.TargetConditions),
                        hasCooldown: !!skillFile.cooldown
                    });
                }
            });
        }
        
        // Sort alphabetically
        skills.sort((a, b) => a.name.localeCompare(b.name));
        
        return skills;
    }

    /**
     * Render the skills list
     * @param {Array<Object>} skills - Skills to render (defaults to all)
     */
    renderSkills(skills = null) {
        const skillsToRender = skills || this.skills;
        const listContainer = document.getElementById('skillBrowserList');
        const emptyState = document.getElementById('skillBrowserEmpty');
        const countDisplay = document.getElementById('skillBrowserCount');
        
        if (!listContainer) return;
        
        if (skillsToRender.length === 0) {
            listContainer.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            if (countDisplay) countDisplay.textContent = 'No skills available';
            return;
        }
        
        listContainer.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';
        if (countDisplay) {
            countDisplay.textContent = `${skillsToRender.length} skill${skillsToRender.length !== 1 ? 's' : ''} available`;
        }
        
        listContainer.innerHTML = skillsToRender.map(skill => {
            const badges = [];
            
            if (skill.lineCount > 0) {
                badges.push(`<span class="badge badge-info">${skill.lineCount} line${skill.lineCount !== 1 ? 's' : ''}</span>`);
            }
            if (skill.hasConditions) {
                badges.push(`<span class="badge badge-warning" title="Has conditions"><i class="fas fa-filter"></i></span>`);
            }
            if (skill.hasCooldown) {
                badges.push(`<span class="badge badge-secondary" title="Has cooldown"><i class="fas fa-clock"></i></span>`);
            }
            
            return `
                <div class="browser-item skill-browser-item" data-skill-name="${this.escapeHtml(skill.name)}">
                    <div class="browser-item-header">
                        <div class="browser-item-title">
                            <i class="fas fa-magic" style="color: var(--accent-primary);"></i>
                            <strong>${this.escapeHtml(skill.name)}</strong>
                        </div>
                        <button class="btn btn-sm btn-primary select-skill-btn" data-skill-name="${this.escapeHtml(skill.name)}">
                            <i class="fas fa-check"></i> Select
                        </button>
                    </div>
                    <div class="browser-item-meta">
                        <span class="meta-item">
                            <i class="fas fa-file-code"></i> ${this.escapeHtml(skill.file)}
                        </span>
                        ${badges.join(' ')}
                    </div>
                </div>
            `;
        }).join('');
        
        // Attach click handlers
        listContainer.querySelectorAll('.select-skill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const skillName = btn.dataset.skillName;
                this.selectSkill(skillName);
            });
        });
        
        // Also allow clicking entire item
        listContainer.querySelectorAll('.skill-browser-item').forEach(item => {
            item.addEventListener('click', () => {
                const skillName = item.dataset.skillName;
                this.selectSkill(skillName);
            });
        });
    }

    /**
     * Filter skills by search query
     * @param {string} query - Search query
     */
    filterSkills(query) {
        if (!query || query.trim() === '') {
            this.renderSkills();
            return;
        }
        
        const lowerQuery = query.toLowerCase();
        const filtered = this.skills.filter(skill => {
            return skill.name.toLowerCase().includes(lowerQuery) ||
                   skill.file.toLowerCase().includes(lowerQuery);
        });
        
        this.renderSkills(filtered);
    }

    /**
     * Select a skill
     * @param {string} skillName - Name of the skill
     */
    selectSkill(skillName) {
        if (this.currentCallback) {
            this.currentCallback(skillName);
        }
        this.close();
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Make globally available
window.SkillBrowser = SkillBrowser;
window.skillBrowser = new SkillBrowser();
