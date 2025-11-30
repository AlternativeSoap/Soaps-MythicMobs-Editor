/**
 * Command Palette Component
 */
class CommandPalette {
    constructor(editor) {
        this.editor = editor;
        this.commands = [
            { id: 'new-mob', title: 'New Mob', description: 'Create a new mob', icon: 'skull', action: () => editor.createNewMob() },
            { id: 'new-skill', title: 'New Skill', description: 'Create a new skill', icon: 'magic', action: () => editor.createNewSkill() },
            { id: 'new-item', title: 'New Item', description: 'Create a new item', icon: 'gem', action: () => editor.createNewItem() },
            { id: 'save', title: 'Save', description: 'Save current file', icon: 'save', action: () => editor.save() },
            { id: 'export', title: 'Export YAML', description: 'Export to YAML file', icon: 'download', action: () => editor.exportYAML() }
        ];
    }
    
    show() {
        const palette = document.getElementById('command-palette');
        if (palette) {
            palette.classList.remove('hidden');
            document.getElementById('command-input')?.focus();
        }
    }
    
    hide() {
        const palette = document.getElementById('command-palette');
        if (palette) {
            palette.classList.add('hidden');
        }
    }
}

window.CommandPalette = CommandPalette;
