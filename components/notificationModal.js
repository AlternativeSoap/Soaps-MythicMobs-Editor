/**
 * Notification Modal Component
 * Modern replacement for native alert() and confirm() dialogs
 * Styled to match the app's dark theme with smooth animations
 */

class NotificationModal {
    constructor() {
        this.currentModal = null;
        this.createStyles();
    }
    
    /**
     * Inject CSS styles
     */
    createStyles() {
        if (document.getElementById('notificationModalStyles')) return;
        
        const styles = `
            <style id="notificationModalStyles">
                .notification-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 99999;
                    opacity: 0;
                    animation: notificationFadeIn 0.2s ease-out forwards;
                }
                
                @keyframes notificationFadeIn {
                    to { opacity: 1; }
                }
                
                .notification-modal-box {
                    background: var(--bg-primary, #1a1a2e);
                    border: 1px solid var(--border-color, #2d2d44);
                    border-radius: 12px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    min-width: 400px;
                    max-width: 500px;
                    transform: scale(0.9) translateY(20px);
                    animation: notificationSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                
                @keyframes notificationSlideIn {
                    to {
                        transform: scale(1) translateY(0);
                    }
                }
                
                .notification-modal-header {
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    border-bottom: 1px solid var(--border-color, #2d2d44);
                }
                
                .notification-modal-icon {
                    font-size: 2rem;
                    flex-shrink: 0;
                }
                
                .notification-modal-icon.info { color: #3498db; }
                .notification-modal-icon.success { color: #2ecc71; }
                .notification-modal-icon.warning { color: #f39c12; }
                .notification-modal-icon.error { color: #e74c3c; }
                .notification-modal-icon.question { color: #9b59b6; }
                
                .notification-modal-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--text-primary, #ffffff);
                    margin: 0;
                }
                
                .notification-modal-body {
                    padding: 1.5rem;
                    color: var(--text-secondary, #b0b0c0);
                    line-height: 1.6;
                    font-size: 0.95rem;
                }
                
                .notification-modal-footer {
                    padding: 1rem 1.5rem;
                    display: flex;
                    gap: 0.75rem;
                    justify-content: flex-end;
                    background: var(--bg-secondary, #16162a);
                    border-top: 1px solid var(--border-color, #2d2d44);
                    border-radius: 0 0 12px 12px;
                }
                
                .notification-modal-btn {
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                    outline: none;
                    min-width: 90px;
                }
                
                .notification-modal-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }
                
                .notification-modal-btn:active {
                    transform: translateY(0);
                }
                
                .notification-modal-btn.primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                
                .notification-modal-btn.primary:hover {
                    background: linear-gradient(135deg, #5568d3 0%, #6a4293 100%);
                }
                
                .notification-modal-btn.secondary {
                    background: var(--bg-tertiary, #252540);
                    color: var(--text-secondary, #b0b0c0);
                    border: 1px solid var(--border-color, #2d2d44);
                }
                
                .notification-modal-btn.secondary:hover {
                    background: var(--bg-secondary, #2d2d44);
                    color: var(--text-primary, #ffffff);
                }
                
                .notification-modal-btn.danger {
                    background: #e74c3c;
                    color: white;
                }
                
                .notification-modal-btn.danger:hover {
                    background: #c0392b;
                }
                
                @media (max-width: 600px) {
                    .notification-modal-box {
                        min-width: 90%;
                        margin: 1rem;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    /**
     * Show alert dialog (replacement for native alert)
     * @param {string} message - The message to display
     * @param {string} type - Type: 'info', 'success', 'warning', 'error'
     * @param {string} title - Optional custom title
     * @returns {Promise} - Resolves when OK is clicked
     */
    alert(message, type = 'info', title = null) {
        return new Promise((resolve) => {
            this.close(); // Close any existing modal
            
            const icons = {
                info: '💬',
                success: '✅',
                warning: '⚠️',
                error: '❌'
            };
            
            const titles = {
                info: 'Information',
                success: 'Success',
                warning: 'Warning',
                error: 'Error'
            };
            
            const icon = icons[type] || icons.info;
            const displayTitle = title || titles[type] || titles.info;
            
            const modal = document.createElement('div');
            modal.className = 'notification-modal-overlay';
            modal.innerHTML = `
                <div class="notification-modal-box">
                    <div class="notification-modal-header">
                        <div class="notification-modal-icon ${type}">${icon}</div>
                        <h3 class="notification-modal-title">${this.escapeHtml(displayTitle)}</h3>
                    </div>
                    <div class="notification-modal-body">
                        ${this.escapeHtml(message)}
                    </div>
                    <div class="notification-modal-footer">
                        <button class="notification-modal-btn primary" data-action="ok">
                            OK
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            this.currentModal = modal;
            
            // Event listeners
            const okBtn = modal.querySelector('[data-action="ok"]');
            const handleClose = () => {
                this.close();
                resolve(true);
            };
            
            okBtn.addEventListener('click', handleClose);
            
            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    handleClose();
                }
            });
            
            // Close on Escape key
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', escapeHandler);
                    handleClose();
                }
            };
            document.addEventListener('keydown', escapeHandler);
            
            // Focus OK button
            setTimeout(() => okBtn.focus(), 100);
        });
    }
    
    /**
     * Show confirm dialog (replacement for native confirm)
     * @param {string} message - The message to display
     * @param {string} title - Optional custom title
     * @param {Object} options - Optional customization
     * @returns {Promise<boolean>} - Resolves with true if confirmed, false if canceled
     */
    confirm(message, title = 'Confirm', options = {}) {
        return new Promise((resolve) => {
            this.close(); // Close any existing modal
            
            const {
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                confirmClass = 'primary',
                icon = '❓',
                type = 'question'
            } = options;
            
            const modal = document.createElement('div');
            modal.className = 'notification-modal-overlay';
            modal.innerHTML = `
                <div class="notification-modal-box">
                    <div class="notification-modal-header">
                        <div class="notification-modal-icon ${type}">${icon}</div>
                        <h3 class="notification-modal-title">${this.escapeHtml(title)}</h3>
                    </div>
                    <div class="notification-modal-body">
                        ${this.escapeHtml(message)}
                    </div>
                    <div class="notification-modal-footer">
                        <button class="notification-modal-btn secondary" data-action="cancel">
                            ${this.escapeHtml(cancelText)}
                        </button>
                        <button class="notification-modal-btn ${confirmClass}" data-action="confirm">
                            ${this.escapeHtml(confirmText)}
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            this.currentModal = modal;
            
            // Event listeners
            const confirmBtn = modal.querySelector('[data-action="confirm"]');
            const cancelBtn = modal.querySelector('[data-action="cancel"]');
            
            const handleConfirm = () => {
                this.close();
                resolve(true);
            };
            
            const handleCancel = () => {
                this.close();
                resolve(false);
            };
            
            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
            
            // Close on overlay click = cancel
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    handleCancel();
                }
            });
            
            // Escape key = cancel
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', escapeHandler);
                    handleCancel();
                }
            };
            document.addEventListener('keydown', escapeHandler);
            
            // Focus confirm button
            setTimeout(() => confirmBtn.focus(), 100);
        });
    }
    
    /**
     * Close the current modal
     */
    close() {
        if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
        }
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
window.notificationModal = new NotificationModal();

// Provide convenience methods on window for easy access
window.showAlert = (message, type, title) => window.notificationModal.alert(message, type, title);
window.showConfirm = (message, title, options) => window.notificationModal.confirm(message, title, options);
