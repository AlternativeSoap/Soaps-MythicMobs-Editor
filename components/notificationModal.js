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
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 99999;
                    opacity: 0;
                    animation: notificationFadeIn 0.25s ease-out forwards;
                }
                
                @keyframes notificationFadeIn {
                    to { opacity: 1; }
                }
                
                .notification-modal-box {
                    background: linear-gradient(145deg, #1e1e3a 0%, #16162e 100%);
                    border: 2px solid transparent;
                    background-clip: padding-box;
                    position: relative;
                    border-radius: 16px;
                    box-shadow: 
                        0 25px 80px rgba(0, 0, 0, 0.7),
                        0 0 0 1px rgba(102, 126, 234, 0.15),
                        inset 0 1px 0 rgba(255, 255, 255, 0.05);
                    min-width: 420px;
                    max-width: 520px;
                    overflow: hidden;
                    transform: scale(0.85) translateY(30px);
                    animation: notificationSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                
                .notification-modal-box::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                    opacity: 0.8;
                }
                
                @keyframes notificationSlideIn {
                    to {
                        transform: scale(1) translateY(0);
                    }
                }
                
                .notification-modal-header {
                    padding: 2rem 2rem 1.25rem 2rem;
                    display: flex;
                    align-items: flex-start;
                    gap: 1.25rem;
                }
                
                .notification-modal-icon {
                    font-size: 2.5rem;
                    flex-shrink: 0;
                    width: 56px;
                    height: 56px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    position: relative;
                    animation: iconPulse 2s ease-in-out infinite;
                }
                
                @keyframes iconPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                .notification-modal-icon.info { 
                    background: rgba(52, 152, 219, 0.15);
                    color: #3498db;
                    box-shadow: 0 0 20px rgba(52, 152, 219, 0.2);
                }
                .notification-modal-icon.success { 
                    background: rgba(46, 204, 113, 0.15);
                    color: #2ecc71;
                    box-shadow: 0 0 20px rgba(46, 204, 113, 0.2);
                }
                .notification-modal-icon.warning { 
                    background: rgba(243, 156, 18, 0.15);
                    color: #f39c12;
                    box-shadow: 0 0 20px rgba(243, 156, 18, 0.2);
                }
                .notification-modal-icon.error { 
                    background: rgba(231, 76, 60, 0.15);
                    color: #e74c3c;
                    box-shadow: 0 0 20px rgba(231, 76, 60, 0.2);
                }
                .notification-modal-icon.question { 
                    background: rgba(155, 89, 182, 0.15);
                    color: #9b59b6;
                    box-shadow: 0 0 20px rgba(155, 89, 182, 0.2);
                }
                
                .notification-modal-title {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: #ffffff;
                    margin: 0;
                    letter-spacing: -0.02em;
                    line-height: 1.4;
                    flex: 1;
                    padding-top: 0.5rem;
                }
                
                .notification-modal-body {
                    padding: 0.5rem 2rem 2rem 2rem;
                    color: rgba(255, 255, 255, 0.75);
                    line-height: 1.7;
                    font-size: 0.98rem;
                    margin-left: 76px;
                }
                
                .notification-modal-footer {
                    padding: 1.25rem 2rem 1.75rem 2rem;
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                    background: rgba(0, 0, 0, 0.2);
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }
                
                .notification-modal-btn {
                    padding: 0.85rem 2rem;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    border: none;
                    outline: none;
                    min-width: 110px;
                    position: relative;
                    overflow: hidden;
                    letter-spacing: 0.02em;
                }
                
                .notification-modal-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
                    opacity: 0;
                    transition: opacity 0.25s;
                }
                
                .notification-modal-btn:hover::before {
                    opacity: 1;
                }
                
                .notification-modal-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
                }
                
                .notification-modal-btn:active {
                    transform: translateY(0);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }
                
                .notification-modal-btn.primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
                }
                
                .notification-modal-btn.primary:hover {
                    background: linear-gradient(135deg, #7a8ef5 0%, #8a5cb8 100%);
                    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.5);
                }
                
                .notification-modal-btn.secondary {
                    background: rgba(255, 255, 255, 0.05);
                    color: rgba(255, 255, 255, 0.8);
                    border: 1.5px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }
                
                .notification-modal-btn.secondary:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: #ffffff;
                    border-color: rgba(255, 255, 255, 0.2);
                }
                
                .notification-modal-btn.danger {
                    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                    color: white;
                    box-shadow: 0 4px 16px rgba(231, 76, 60, 0.4);
                }
                
                .notification-modal-btn.danger:hover {
                    background: linear-gradient(135deg, #f15d4d 0%, #d4483a 100%);
                    box-shadow: 0 8px 24px rgba(231, 76, 60, 0.5);
                }
                
                @media (max-width: 600px) {
                    .notification-modal-box {
                        min-width: 90%;
                        margin: 1rem;
                    }
                    
                    .notification-modal-header,
                    .notification-modal-body,
                    .notification-modal-footer {
                        padding-left: 1.5rem;
                        padding-right: 1.5rem;
                    }
                    
                    .notification-modal-body {
                        margin-left: 0;
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
