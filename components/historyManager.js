/**
 * HistoryManager - Undo/Redo system for editor state
 * Tracks state snapshots and allows reverting changes
 */
class HistoryManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxStackSize = 50;
        this.isRestoring = false;
        
        // Register keyboard shortcuts for undo/redo
        this.registerShortcuts();
    }
    
    /**
     * Register keyboard shortcuts
     */
    registerShortcuts() {
        document.addEventListener('keyboard-shortcut', (e) => {
            if (e.detail.action === 'undo') {
                this.undo();
            } else if (e.detail.action === 'redo') {
                this.redo();
            }
        });
    }
    
    /**
     * Save current state to history
     * @param {Object} state - State object to save
     * @param {string} description - Description of the change
     */
    saveState(state, description = '') {
        // Don't save if we're restoring a state
        if (this.isRestoring) {
            return;
        }
        
        // Create state snapshot
        const snapshot = {
            state: this.deepClone(state),
            description: description,
            timestamp: Date.now()
        };
        
        // Add to undo stack
        this.undoStack.push(snapshot);
        
        // Limit stack size
        if (this.undoStack.length > this.maxStackSize) {
            this.undoStack.shift();
        }
        
        // Clear redo stack when new state is saved
        this.redoStack = [];
        
        // Emit event
        this.emitStateChange();
    }
    
    /**
     * Undo last change
     * @returns {Object|null} Previous state or null if nothing to undo
     */
    undo() {
        if (!this.canUndo()) {
            return null;
        }
        
        // Get current state from undo stack
        const currentSnapshot = this.undoStack.pop();
        
        // Move to redo stack
        this.redoStack.push(currentSnapshot);
        
        // Get previous state (peek at top of undo stack)
        const previousSnapshot = this.undoStack[this.undoStack.length - 1];
        
        if (previousSnapshot) {
            // Mark as restoring to prevent saving during restore
            this.isRestoring = true;
            
            // Emit event with previous state
            this.emitUndo(previousSnapshot);
            
            // Reset restoring flag after a short delay
            setTimeout(() => {
                this.isRestoring = false;
            }, 100);
            
            // Emit state change
            this.emitStateChange();
            
            return previousSnapshot.state;
        }
        
        return null;
    }
    
    /**
     * Redo last undone change
     * @returns {Object|null} Next state or null if nothing to redo
     */
    redo() {
        if (!this.canRedo()) {
            return null;
        }
        
        // Get state from redo stack
        const nextSnapshot = this.redoStack.pop();
        
        // Move back to undo stack
        this.undoStack.push(nextSnapshot);
        
        if (nextSnapshot) {
            // Mark as restoring
            this.isRestoring = true;
            
            // Emit event with next state
            this.emitRedo(nextSnapshot);
            
            // Reset restoring flag
            setTimeout(() => {
                this.isRestoring = false;
            }, 100);
            
            // Emit state change
            this.emitStateChange();
            
            return nextSnapshot.state;
        }
        
        return null;
    }
    
    /**
     * Check if undo is available
     * @returns {boolean}
     */
    canUndo() {
        return this.undoStack.length > 1; // Need at least 2 states (current + previous)
    }
    
    /**
     * Check if redo is available
     * @returns {boolean}
     */
    canRedo() {
        return this.redoStack.length > 0;
    }
    
    /**
     * Get undo stack length
     * @returns {number}
     */
    getUndoCount() {
        return Math.max(0, this.undoStack.length - 1);
    }
    
    /**
     * Get redo stack length
     * @returns {number}
     */
    getRedoCount() {
        return this.redoStack.length;
    }
    
    /**
     * Clear all history
     */
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.emitStateChange();
    }
    
    /**
     * Deep clone an object
     * @param {*} obj - Object to clone
     * @returns {*} Cloned object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        
        if (obj instanceof Object) {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }
    
    /**
     * Emit undo event
     * @param {Object} snapshot - State snapshot
     */
    emitUndo(snapshot) {
        const event = new CustomEvent('history-undo', {
            detail: {
                state: snapshot.state,
                description: snapshot.description,
                timestamp: snapshot.timestamp
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Emit redo event
     * @param {Object} snapshot - State snapshot
     */
    emitRedo(snapshot) {
        const event = new CustomEvent('history-redo', {
            detail: {
                state: snapshot.state,
                description: snapshot.description,
                timestamp: snapshot.timestamp
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Emit state change event
     */
    emitStateChange() {
        const event = new CustomEvent('history-state-change', {
            detail: {
                canUndo: this.canUndo(),
                canRedo: this.canRedo(),
                undoCount: this.getUndoCount(),
                redoCount: this.getRedoCount()
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Get history summary
     * @returns {Array} Array of state descriptions
     */
    getHistory() {
        return this.undoStack.map(snapshot => ({
            description: snapshot.description,
            timestamp: snapshot.timestamp
        }));
    }
    
    /**
     * Get undo description
     * @returns {string} Description of what will be undone
     */
    getUndoDescription() {
        if (this.undoStack.length < 2) {
            return '';
        }
        const currentSnapshot = this.undoStack[this.undoStack.length - 1];
        return currentSnapshot.description || 'Undo';
    }
    
    /**
     * Get redo description
     * @returns {string} Description of what will be redone
     */
    getRedoDescription() {
        if (this.redoStack.length === 0) {
            return '';
        }
        const nextSnapshot = this.redoStack[this.redoStack.length - 1];
        return nextSnapshot.description || 'Redo';
    }
}
