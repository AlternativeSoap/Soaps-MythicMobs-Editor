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
                    background: rgba(0, 0, 0, 0.75);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 99999;
                    opacity: 0;
                    animation: notificationFadeIn 0.15s ease-out forwards;
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
                    transform: scale(0.95) translateY(10px);
                    animation: notificationSlideIn 0.15s ease-out forwards;
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
                }
                
                .notification-modal-icon.info { 
                    background: rgba(52, 152, 219, 0.15);
                    color: #3498db;
                }
                .notification-modal-icon.success { 
                    background: rgba(46, 204, 113, 0.15);
                    color: #2ecc71;
                }
                .notification-modal-icon.warning { 
                    background: rgba(243, 156, 18, 0.15);
                    color: #f39c12;
                }
                .notification-modal-icon.error { 
                    background: rgba(231, 76, 60, 0.15);
                    color: #e74c3c;
                }
                .notification-modal-icon.question { 
                    background: rgba(155, 89, 182, 0.15);
                    color: #9b59b6;
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
                    transition: background 0.15s, box-shadow 0.15s;
                    border: none;
                    outline: none;
                    min-width: 110px;
                    letter-spacing: 0.02em;
                }
                
                .notification-modal-btn:hover {
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
                }
                
                .notification-modal-btn:active {
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }
                
                .notification-modal-btn.primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
                }
                
                .notification-modal-btn.primary:hover {
                    background: linear-gradient(135deg, #7a8ef5 0%, #8a5cb8 100%);
                }
                
                .notification-modal-btn.secondary {
                    background: rgba(255, 255, 255, 0.05);
                    color: rgba(255, 255, 255, 0.8);
                    border: 1.5px solid rgba(255, 255, 255, 0.1);
                }
                
                .notification-modal-btn.secondary:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #ffffff;
                }
                
                .notification-modal-btn.danger {
                    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                    color: white;
                    box-shadow: 0 4px 16px rgba(231, 76, 60, 0.4);
                }
                
                .notification-modal-btn.danger:hover {
                    background: linear-gradient(135deg, #f15d4d 0%, #d4483a 100%);
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
     * Show a custom modal with title, message, and configurable buttons
     * @param {string} title - The title of the modal
     * @param {string} message - The message to display
     * @param {Array} buttons - Array of button configs: {text, primary?, danger?, callback}
     * @param {Object} options - Optional: {icon, type}
     */
    show(title, message, buttons = [], options = {}) {
        this.close(); // Close any existing modal
        
        const {
            icon = '📁',
            type = 'warning'
        } = options;
        
        // Auto-detect type from title
        let detectedType = type;
        let detectedIcon = icon;
        
        if (title.toLowerCase().includes('not found') || title.toLowerCase().includes('missing')) {
            detectedType = 'warning';
            detectedIcon = '🔍';
        } else if (title.toLowerCase().includes('delete') || title.toLowerCase().includes('remove')) {
            detectedType = 'error';
            detectedIcon = '🗑️';
        } else if (title.toLowerCase().includes('success')) {
            detectedType = 'success';
            detectedIcon = '✅';
        } else if (title.toLowerCase().includes('error')) {
            detectedType = 'error';
            detectedIcon = '❌';
        }
        
        // Build buttons HTML
        const buttonsHtml = buttons.map((btn, index) => {
            let btnClass = 'secondary';
            if (btn.primary) btnClass = 'primary';
            if (btn.danger) btnClass = 'danger';
            
            return `<button class="notification-modal-btn ${btnClass}" data-btn-index="${index}">
                ${this.escapeHtml(btn.text)}
            </button>`;
        }).join('');
        
        // Default to OK button if no buttons provided
        const finalButtonsHtml = buttonsHtml || `<button class="notification-modal-btn primary" data-btn-index="0">OK</button>`;
        
        const modal = document.createElement('div');
        modal.className = 'notification-modal-overlay';
        modal.innerHTML = `
            <div class="notification-modal-box">
                <div class="notification-modal-header">
                    <div class="notification-modal-icon ${detectedType}">${detectedIcon}</div>
                    <h3 class="notification-modal-title">${this.escapeHtml(title)}</h3>
                </div>
                <div class="notification-modal-body">
                    ${this.escapeHtml(message)}
                </div>
                <div class="notification-modal-footer">
                    ${finalButtonsHtml}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.currentModal = modal;
        
        // Event listeners for all buttons
        modal.querySelectorAll('[data-btn-index]').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.btnIndex);
                const buttonConfig = buttons[index];
                this.close();
                if (buttonConfig && buttonConfig.callback) {
                    buttonConfig.callback();
                }
            });
        });
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close();
            }
        });
        
        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', escapeHandler);
                this.close();
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        // Focus first primary button, or first button
        setTimeout(() => {
            const primaryBtn = modal.querySelector('.notification-modal-btn.primary');
            const firstBtn = modal.querySelector('.notification-modal-btn');
            (primaryBtn || firstBtn)?.focus();
        }, 100);
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
