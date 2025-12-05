/**
 * Command Palette Component
 */
class CommandPalette {
    constructor(editor) {
        this.editor = editor;
        this.commands = [
            { id: 'help', title: 'Help', description: 'Show all keyboard shortcuts', icon: 'question-circle', keywords: ['help', '/help', 'shortcuts', 'keyboard'], action: () => { this.hide(); editor.showAllShortcuts(); } },
            { id: 'new-mob', title: 'New Mob', description: 'Create a new mob (Ctrl+N)', icon: 'skull', keywords: ['new', 'mob', 'create'], action: () => { this.hide(); editor.createNewMob(); } },
            { id: 'new-skill', title: 'New Skill', description: 'Create a new skill (Ctrl+Shift+M)', icon: 'magic', keywords: ['new', 'skill', 'create'], action: () => { this.hide(); editor.createNewSkill(); } },
            { id: 'new-item', title: 'New Item', description: 'Create a new item (Ctrl+Shift+I)', icon: 'gem', keywords: ['new', 'item', 'create'], action: () => { this.hide(); editor.createNewItem(); } },
            { id: 'new-droptable', title: 'New DropTable', description: 'Create a new droptable (Ctrl+Shift+T)', icon: 'table', keywords: ['new', 'droptable', 'loot', 'create'], action: () => { this.hide(); editor.createNewDropTable(); } },
            { id: 'new-randomspawn', title: 'New RandomSpawn', description: 'Create a new randomspawn (Ctrl+Shift+R)', icon: 'map-marked-alt', keywords: ['new', 'randomspawn', 'spawn', 'create'], action: () => { this.hide(); editor.createNewRandomSpawn(); } },
            { id: 'save', title: 'Save', description: 'Save current file (Ctrl+S)', icon: 'save', keywords: ['save'], action: () => { this.hide(); editor.save(); } },
            { id: 'import', title: 'Import YAML', description: 'Import YAML file (Ctrl+Shift+O)', icon: 'file-import', keywords: ['import', 'yaml', 'load'], action: () => { this.hide(); editor.showImportDialog(); } },
            { id: 'export', title: 'Export YAML', description: 'Export to YAML file (Ctrl+E)', icon: 'download', keywords: ['export', 'yaml', 'download'], action: () => { this.hide(); editor.exportYAML(); } }
        ];
        this.input = null;
        this.results = null;
        this.selectedIndex = 0;
        this.filteredCommands = [];
        this.init();
    }
    
    init() {
        // Setup input listener
        document.addEventListener('DOMContentLoaded', () => {
            this.input = document.getElementById('command-input');
            this.results = document.getElementById('command-results');
            
            if (this.input) {
                this.input.addEventListener('input', (e) => this.filterCommands(e.target.value));
                this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
            }
        });
    }
    
    show() {
        const palette = document.getElementById('command-palette');
        if (palette) {
            palette.classList.remove('hidden');
            this.input = document.getElementById('command-input');
            this.results = document.getElementById('command-results');
            
            if (this.input) {
                this.input.value = '';
                this.input.focus();
                this.filterCommands('');
            }
        }
    }
    
    hide() {
        const palette = document.getElementById('command-palette');
        if (palette) {
            palette.classList.add('hidden');
            if (this.input) {
                this.input.value = '';
            }
        }
    }
    
    filterCommands(query) {
        const lowerQuery = query.toLowerCase().trim();
        
        if (!lowerQuery) {
            this.filteredCommands = this.commands;
        } else {
            this.filteredCommands = this.commands.filter(cmd => {
                const searchText = `${cmd.title} ${cmd.description} ${cmd.keywords?.join(' ') || ''}`.toLowerCase();
                return searchText.includes(lowerQuery);
            });
        }
        
        this.selectedIndex = 0;
        this.renderResults();
    }
    
    renderResults() {
        if (!this.results) return;
        
        if (this.filteredCommands.length === 0) {
            this.results.innerHTML = `
                <div class="command-item command-empty">
                    <i class="fas fa-search"></i>
                    <span>No commands found. Try "help" for assistance.</span>
                </div>
            `;
            return;
        }
        
        this.results.innerHTML = this.filteredCommands.map((cmd, index) => `
            <div class="command-item ${index === this.selectedIndex ? 'selected' : ''}" data-index="${index}">
                <i class="fas fa-${cmd.icon}"></i>
                <div class="command-info">
                    <div class="command-title">${cmd.title}</div>
                    <div class="command-description">${cmd.description}</div>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        this.results.querySelectorAll('.command-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.executeCommand(this.filteredCommands[index]);
            });
        });
    }
    
    handleKeydown(e) {
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredCommands.length - 1);
                this.renderResults();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this.renderResults();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.filteredCommands[this.selectedIndex]) {
                    this.executeCommand(this.filteredCommands[this.selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                this.hide();
                break;
        }
    }
    
    executeCommand(command) {
        if (command && command.action) {
            command.action();
        }
    }
}

window.CommandPalette = CommandPalette;
