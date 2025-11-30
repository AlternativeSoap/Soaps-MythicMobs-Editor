// Editor History - Undo/Redo functionality
class EditorHistory {
    constructor(editor) {
        this.editor = editor;
        this.history = [];
        this.currentIndex = -1;
    }
    
    undo() {
        this.editor.showToast('Undo feature coming soon!', 'info');
    }
    
    redo() {
        this.editor.showToast('Redo feature coming soon!', 'info');
    }
}
window.EditorHistory = EditorHistory;
