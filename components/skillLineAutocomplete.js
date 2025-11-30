/**
 * Skill Line Autocomplete Engine
 * Provides intelligent autocomplete suggestions for MythicMobs skill lines
 * Supports mechanics, targeters, conditions, triggers, and attribute completion
 */

class SkillLineAutocomplete {
    constructor(textareaElement) {
        this.textarea = textareaElement;
        this.overlay = null;
        this.suggestionsList = null;
        this.currentSuggestions = [];
        this.selectedIndex = 0;
        this.isVisible = false;
        this.context = 'mob'; // or 'skill'
        
        // Cache data
        this.mechanics = this.loadMechanicsData();
        this.targeters = this.loadTargetersData();
        this.conditions = this.loadConditionsData();
        this.triggers = this.loadTriggersData();
        
        this.createOverlay();
        this.attachEventListeners();
    }

    /**
     * Load mechanics data from MECHANICS_DATA
     */
    loadMechanicsData() {
        if (!window.MECHANICS_DATA) return [];
        
        return MECHANICS_DATA.mechanics.map(m => ({
            type: 'mechanic',
            name: m.name || m.id,
            aliases: m.aliases || [],
            description: m.description || '',
            attributes: m.attributes || [],
            category: m.category || 'utility',
            examples: m.examples || []
        }));
    }

    /**
     * Load targeters data from TARGETERS_DATA
     */
    loadTargetersData() {
        if (!window.TARGETERS_DATA) return [];
        
        return TARGETERS_DATA.targeters.map(t => ({
            type: 'targeter',
            name: t.name || t.id,
            aliases: t.aliases || [],
            description: t.description || '',
            attributes: t.attributes || [],
            category: t.category || 'single_entity',
            examples: t.examples || []
        }));
    }

    /**
     * Load conditions data from CONDITIONS_DATA
     */
    loadConditionsData() {
        if (!window.CONDITIONS_DATA) return [];
        
        const conditions = [];
        Object.entries(CONDITIONS_DATA).forEach(([category, condList]) => {
            condList.forEach(c => {
                conditions.push({
                    type: 'condition',
                    name: c.name,
                    description: c.description || '',
                    params: c.params || [],
                    category: category.toLowerCase()
                });
            });
        });
        
        return conditions;
    }

    /**
     * Load triggers data
     */
    loadTriggersData() {
        // Common triggers
        return [
            { name: 'onAttack', description: 'When mob attacks', category: 'combat' },
            { name: 'onDamaged', description: 'When mob takes damage', category: 'combat' },
            { name: 'onSpawn', description: 'When mob spawns', category: 'lifecycle' },
            { name: 'onDeath', description: 'When mob dies', category: 'lifecycle' },
            { name: 'onTimer', description: 'Every X ticks (e.g., ~onTimer:20)', category: 'time', hasParam: true },
            { name: 'onInteract', description: 'When player interacts', category: 'interaction' },
            { name: 'onSignal', description: 'When receives signal', category: 'event', hasParam: true },
            { name: 'onShoot', description: 'When shoots projectile', category: 'combat' },
            { name: 'onTeleport', description: 'When teleports', category: 'movement' },
            { name: 'onExplode', description: 'When explodes', category: 'combat' },
            { name: 'onBlockBreak', description: 'When breaks block', category: 'world' },
            { name: 'onBlockPlace', description: 'When places block', category: 'world' },
            { name: 'onChangeBlock', description: 'When changes block', category: 'world' },
            { name: 'onEnterCombat', description: 'When enters combat', category: 'combat' },
            { name: 'onDropCombat', description: 'When exits combat', category: 'combat' },
            { name: 'onLoad', description: 'When chunk loads', category: 'lifecycle' }
        ];
    }

    /**
     * Create the autocomplete overlay
     */
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'skill-autocomplete-overlay';
        this.overlay.style.display = 'none';
        
        this.suggestionsList = document.createElement('div');
        this.suggestionsList.className = 'skill-autocomplete-list';
        
        this.overlay.appendChild(this.suggestionsList);
        document.body.appendChild(this.overlay);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Input event for autocomplete triggers
        this.textarea.addEventListener('input', (e) => this.handleInput(e));
        
        // Keydown for navigation
        this.textarea.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!this.overlay.contains(e.target) && e.target !== this.textarea) {
                this.hide();
            }
        });
        
        // Handle blur with delay
        this.textarea.addEventListener('blur', () => {
            setTimeout(() => this.hide(), 200);
        });
    }

    /**
     * Handle input changes
     */
    handleInput(e) {
        const cursorPos = this.textarea.selectionStart;
        const text = this.textarea.value;
        const context = this.getContext(text, cursorPos);
        
        if (context.shouldAutocomplete) {
            this.showSuggestions(context);
        } else {
            this.hide();
        }
    }

    /**
     * Get context at cursor position
     */
    getContext(text, cursorPos) {
        // Get text before cursor
        const textBefore = text.substring(0, cursorPos);
        const textAfter = text.substring(cursorPos);
        
        // Find the start of current line
        const lineStart = textBefore.lastIndexOf('\n') + 1;
        const currentLine = text.substring(lineStart, cursorPos);
        
        // Check what we're typing
        const context = {
            shouldAutocomplete: false,
            type: null,
            query: '',
            prefix: '',
            line: currentLine,
            cursorPos: cursorPos,
            lineStart: lineStart
        };
        
        // Check if typing mechanic (after "- " or at start)
        if (/^(\s*-\s*)(\w*)$/.test(currentLine)) {
            const match = currentLine.match(/^(\s*-\s*)(\w*)$/);
            context.shouldAutocomplete = true;
            context.type = 'mechanic';
            context.query = match[2] || '';
            context.prefix = match[1];
            return context;
        }
        
        // Check if typing targeter (after @)
        const targeterMatch = currentLine.match(/@(\w*)$/);
        if (targeterMatch) {
            context.shouldAutocomplete = true;
            context.type = 'targeter';
            context.query = targeterMatch[1] || '';
            context.prefix = '@';
            return context;
        }
        
        // Check if typing trigger (after ~)
        const triggerMatch = currentLine.match(/~(\w*)$/);
        if (triggerMatch && this.context !== 'skill') {
            context.shouldAutocomplete = true;
            context.type = 'trigger';
            context.query = triggerMatch[1] || '';
            context.prefix = '~';
            return context;
        }
        
        // Check if typing condition (after ?)
        const conditionMatch = currentLine.match(/\?(\w*)$/);
        if (conditionMatch) {
            context.shouldAutocomplete = true;
            context.type = 'condition';
            context.query = conditionMatch[1] || '';
            context.prefix = '?';
            return context;
        }
        
        // Check if typing attribute inside braces
        const inBracesMatch = currentLine.match(/(\w+)\{([^}]*?)(\w*)$/);
        if (inBracesMatch) {
            const componentName = inBracesMatch[1];
            const existingArgs = inBracesMatch[2];
            const currentArg = inBracesMatch[3] || '';
            
            context.shouldAutocomplete = true;
            context.type = 'attribute';
            context.query = currentArg;
            context.componentName = componentName;
            context.existingArgs = existingArgs;
            return context;
        }
        
        return context;
    }

    /**
     * Show suggestions based on context
     */
    showSuggestions(context) {
        let suggestions = [];
        
        switch (context.type) {
            case 'mechanic':
                suggestions = this.getMechanicSuggestions(context.query);
                break;
            case 'targeter':
                suggestions = this.getTargeterSuggestions(context.query);
                break;
            case 'trigger':
                suggestions = this.getTriggerSuggestions(context.query);
                break;
            case 'condition':
                suggestions = this.getConditionSuggestions(context.query);
                break;
            case 'attribute':
                suggestions = this.getAttributeSuggestions(context.componentName, context.query, context.existingArgs);
                break;
        }
        
        if (suggestions.length === 0) {
            this.hide();
            return;
        }
        
        this.currentSuggestions = suggestions;
        this.currentContext = context;
        this.selectedIndex = 0;
        this.renderSuggestions();
        this.show();
    }

    /**
     * Get mechanic suggestions based on fuzzy matching
     */
    getMechanicSuggestions(query) {
        // Check if user prefers effect: prefix
        const useEffectPrefix = localStorage.getItem('mechanicBrowser_useEffectPrefix') === 'true';
        
        return this.fuzzyMatch(query, this.mechanics, (m) => [m.name, ...m.aliases])
            .slice(0, 10)
            .map(m => {
                // Check if this mechanic has effect: alias
                const hasEffectPrefix = m.aliases && m.aliases.some(alias => 
                    alias.startsWith('effect:') || alias.startsWith('e:')
                );
                
                const mechanicName = (hasEffectPrefix && useEffectPrefix) 
                    ? `effect:${m.name}` 
                    : m.name;
                
                return {
                    text: m.name,
                    display: mechanicName,
                    description: m.description,
                    category: m.category,
                    icon: this.getMechanicIcon(m.category),
                    insertText: `${mechanicName}{}`
                };
            });
    }

    /**
     * Get targeter suggestions
     */
    getTargeterSuggestions(query) {
        return this.fuzzyMatch(query, this.targeters, (t) => [t.name, ...t.aliases])
            .slice(0, 10)
            .map(t => ({
                text: t.name,
                display: t.name,
                description: t.description,
                category: t.category,
                icon: '🎯',
                insertText: t.name
            }));
    }

    /**
     * Get trigger suggestions
     */
    getTriggerSuggestions(query) {
        return this.fuzzyMatch(query, this.triggers, (t) => [t.name])
            .slice(0, 10)
            .map(t => ({
                text: t.name,
                display: t.name,
                description: t.description,
                category: t.category,
                icon: '⚡',
                insertText: t.hasParam ? `${t.name}:20` : t.name
            }));
    }

    /**
     * Get condition suggestions
     */
    getConditionSuggestions(query) {
        return this.fuzzyMatch(query, this.conditions, (c) => [c.name])
            .slice(0, 10)
            .map(c => ({
                text: c.name,
                display: c.name,
                description: c.description,
                category: c.category,
                icon: '❓',
                insertText: c.params.length > 0 ? `${c.name}{}` : c.name
            }));
    }

    /**
     * Get attribute suggestions for a component
     */
    getAttributeSuggestions(componentName, query, existingArgs) {
        // Find the component
        let component = this.mechanics.find(m => 
            m.name.toLowerCase() === componentName.toLowerCase() ||
            m.aliases.some(a => a.toLowerCase() === componentName.toLowerCase())
        );
        
        if (!component) {
            component = this.targeters.find(t => 
                t.name.toLowerCase() === componentName.toLowerCase() ||
                t.aliases.some(a => a.toLowerCase() === componentName.toLowerCase())
            );
        }
        
        if (!component) {
            component = this.conditions.find(c => 
                c.name.toLowerCase() === componentName.toLowerCase()
            );
        }
        
        if (!component || !component.attributes) return [];
        
        // Parse existing arguments
        const existingArgNames = new Set();
        if (existingArgs) {
            existingArgs.split(';').forEach(arg => {
                const [key] = arg.split('=');
                if (key) existingArgNames.add(key.trim().toLowerCase());
            });
        }
        
        // Filter out already used attributes
        const availableAttrs = component.attributes.filter(attr => {
            const allNames = [attr.name, ...(attr.alias || [])].map(n => n.toLowerCase());
            return !allNames.some(n => existingArgNames.has(n));
        });
        
        return this.fuzzyMatch(query, availableAttrs, (a) => [a.name, ...(a.alias || [])])
            .slice(0, 10)
            .map(attr => ({
                text: attr.name,
                display: `${attr.name}${attr.alias && attr.alias.length > 0 ? ` (${attr.alias.join(', ')})` : ''}`,
                description: `${attr.description || ''} (${attr.type || 'string'}, default: ${attr.default || 'none'})`,
                category: 'attribute',
                icon: '🔧',
                insertText: `${attr.name}=${this.getDefaultValue(attr)}`
            }));
    }

    /**
     * Get default value placeholder for attribute
     */
    getDefaultValue(attr) {
        if (attr.default !== undefined && attr.default !== null) {
            return attr.default;
        }
        
        switch (attr.type) {
            case 'number':
                return '0';
            case 'boolean':
                return 'true';
            case 'string':
                return '';
            default:
                return '';
        }
    }

    /**
     * Fuzzy match algorithm
     */
    fuzzyMatch(query, items, getSearchableFields) {
        if (!query) return items;
        
        const lowerQuery = query.toLowerCase();
        const scored = [];
        
        for (const item of items) {
            const fields = getSearchableFields(item);
            let bestScore = 0;
            
            for (const field of fields) {
                const lowerField = field.toLowerCase();
                
                // Exact match
                if (lowerField === lowerQuery) {
                    bestScore = Math.max(bestScore, 1000);
                }
                // Starts with
                else if (lowerField.startsWith(lowerQuery)) {
                    bestScore = Math.max(bestScore, 500);
                }
                // Contains
                else if (lowerField.includes(lowerQuery)) {
                    bestScore = Math.max(bestScore, 100);
                }
                // Fuzzy match (consecutive characters)
                else {
                    let score = 0;
                    let queryIndex = 0;
                    for (let i = 0; i < lowerField.length && queryIndex < lowerQuery.length; i++) {
                        if (lowerField[i] === lowerQuery[queryIndex]) {
                            score += 10;
                            queryIndex++;
                        }
                    }
                    if (queryIndex === lowerQuery.length) {
                        bestScore = Math.max(bestScore, score);
                    }
                }
            }
            
            if (bestScore > 0) {
                scored.push({ item, score: bestScore });
            }
        }
        
        // Sort by score
        scored.sort((a, b) => b.score - a.score);
        return scored.map(s => s.item);
    }

    /**
     * Get icon for mechanic category
     */
    getMechanicIcon(category) {
        const icons = {
            damage: '⚔️',
            heal: '❤️',
            movement: '🏃',
            effects: '✨',
            control: '🎮',
            utility: '🔧',
            aura: '🔮',
            projectile: '🎯'
        };
        return icons[category] || '⚙️';
    }

    /**
     * Render suggestions in overlay
     */
    renderSuggestions() {
        this.suggestionsList.innerHTML = '';
        
        this.currentSuggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            if (index === this.selectedIndex) {
                item.classList.add('selected');
            }
            
            item.innerHTML = `
                <div class="autocomplete-item-header">
                    <span class="autocomplete-icon">${suggestion.icon}</span>
                    <span class="autocomplete-name">${this.highlightMatch(suggestion.display, this.currentContext.query)}</span>
                    ${suggestion.category ? `<span class="autocomplete-category">${suggestion.category}</span>` : ''}
                </div>
                ${suggestion.description ? `<div class="autocomplete-description">${suggestion.description}</div>` : ''}
            `;
            
            item.addEventListener('click', () => {
                this.selectSuggestion(index);
            });
            
            this.suggestionsList.appendChild(item);
        });
    }

    /**
     * Highlight matching text
     */
    highlightMatch(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }

    /**
     * Handle keydown events
     */
    handleKeydown(e) {
        if (!this.isVisible) return;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.currentSuggestions.length - 1);
                this.renderSuggestions();
                this.scrollSelectedIntoView();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this.renderSuggestions();
                this.scrollSelectedIntoView();
                break;
                
            case 'Enter':
            case 'Tab':
                if (this.currentSuggestions.length > 0) {
                    e.preventDefault();
                    this.selectSuggestion(this.selectedIndex);
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                this.hide();
                break;
        }
    }

    /**
     * Select a suggestion
     */
    selectSuggestion(index) {
        const suggestion = this.currentSuggestions[index];
        if (!suggestion) return;
        
        const cursorPos = this.textarea.selectionStart;
        const text = this.textarea.value;
        const context = this.currentContext;
        
        // Find where to insert
        const beforeQuery = text.substring(0, cursorPos - context.query.length);
        const afterCursor = text.substring(cursorPos);
        
        // Insert the suggestion
        const newText = beforeQuery + suggestion.insertText + afterCursor;
        this.textarea.value = newText;
        
        // Set cursor position after insertion
        const newCursorPos = beforeQuery.length + suggestion.insertText.length;
        this.textarea.setSelectionRange(newCursorPos, newCursorPos);
        
        // Trigger input event to update highlighting/validation
        this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
        
        this.hide();
        this.textarea.focus();
    }

    /**
     * Scroll selected item into view
     */
    scrollSelectedIntoView() {
        const selectedItem = this.suggestionsList.querySelector('.autocomplete-item.selected');
        if (selectedItem) {
            selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    /**
     * Show the overlay
     */
    show() {
        this.isVisible = true;
        this.overlay.style.display = 'block';
        this.positionOverlay();
    }

    /**
     * Hide the overlay
     */
    hide() {
        this.isVisible = false;
        this.overlay.style.display = 'none';
        this.currentSuggestions = [];
    }

    /**
     * Position the overlay near the cursor
     */
    positionOverlay() {
        const rect = this.textarea.getBoundingClientRect();
        const scrollTop = this.textarea.scrollTop;
        const scrollLeft = this.textarea.scrollLeft;
        
        // Get cursor position (approximate)
        const cursorPos = this.textarea.selectionStart;
        const textBeforeCursor = this.textarea.value.substring(0, cursorPos);
        const lines = textBeforeCursor.split('\n');
        const currentLineIndex = lines.length - 1;
        const currentLineText = lines[currentLineIndex];
        
        // Calculate position
        const lineHeight = 20; // Approximate line height
        const charWidth = 8; // Approximate character width
        
        const top = rect.top + (currentLineIndex * lineHeight) + lineHeight - scrollTop;
        const left = rect.left + (currentLineText.length * charWidth) - scrollLeft;
        
        this.overlay.style.top = `${top}px`;
        this.overlay.style.left = `${left}px`;
        
        // Adjust if off-screen
        const overlayRect = this.overlay.getBoundingClientRect();
        if (overlayRect.right > window.innerWidth) {
            this.overlay.style.left = `${window.innerWidth - overlayRect.width - 10}px`;
        }
        if (overlayRect.bottom > window.innerHeight) {
            this.overlay.style.top = `${rect.top - overlayRect.height}px`;
        }
    }

    /**
     * Set context (mob or skill)
     */
    setContext(context) {
        this.context = context;
    }

    /**
     * Destroy the autocomplete
     */
    destroy() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillLineAutocomplete;
}

console.log('✅ SkillLineAutocomplete engine loaded');
