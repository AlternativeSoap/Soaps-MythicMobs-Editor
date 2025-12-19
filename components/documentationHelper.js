/**
 * DocumentationHelper - Component for showing Audience and Math documentation
 * Provides modal popups with searchable reference information
 */

class DocumentationHelper {
    static showAudienceHelp() {
        const { AUDIENCE_TYPES, AUDIENCE_MECHANICS, AUDIENCE_EXAMPLES } = window.AudienceDocumentation || {};
        
        if (!AUDIENCE_TYPES) {
            console.error('Audience documentation not loaded');
            return;
        }

        // Remove any existing modal-overlay to prevent duplicates
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-dialog" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3><i class="fas fa-users"></i> Audience Mechanic Reference</h3>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 6px; padding: 12px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: start; gap: 10px;">
                            <i class="fas fa-info-circle" style="color: #3b82f6; margin-top: 2px; font-size: 20px;"></i>
                            <div style="flex: 1;">
                                <strong style="color: #3b82f6; font-size: 14px;">What is Audience?</strong>
                                <p style="margin: 8px 0 0 0; font-size: 13px; color: var(--text-secondary);">
                                    The <code>audience</code> parameter controls who can see visual effects like particles, holograms, and totems. 
                                    By default, everyone in the world can see these effects. Use audience to make effects visible only to specific players.
                                </p>
                            </div>
                        </div>
                    </div>

                    <h4 style="margin-top: 20px; margin-bottom: 12px; color: var(--text-primary);">
                        <i class="fas fa-list"></i> Audience Types
                    </h4>
                    <div style="display: grid; gap: 12px;">
                        ${AUDIENCE_TYPES.map(type => `
                            <div class="list-item" style="padding: 12px; background: var(--bg-secondary); border-radius: 6px;">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                    <div>
                                        <strong style="color: var(--primary); font-size: 14px;">${type.name}</strong>
                                        ${type.aliases.length > 0 ? `<span style="color: var(--text-tertiary); font-size: 12px; margin-left: 8px;">(${type.aliases.join(', ')})</span>` : ''}
                                    </div>
                                    <code style="background: var(--bg-tertiary); padding: 2px 8px; border-radius: 4px; font-size: 12px;">${type.example}</code>
                                </div>
                                <p style="margin: 4px 0; font-size: 13px; color: var(--text-secondary);">${type.description}</p>
                                <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 6px;">
                                    <i class="fas fa-lightbulb" style="color: #fbbf24; margin-right: 4px;"></i>
                                    <strong>Use Case:</strong> ${type.useCase}
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <h4 style="margin-top: 24px; margin-bottom: 12px; color: var(--text-primary);">
                        <i class="fas fa-wand-magic-sparkles"></i> Compatible Mechanics
                    </h4>
                    <div style="background: var(--bg-secondary); border-radius: 6px; padding: 12px;">
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${AUDIENCE_MECHANICS.map(mech => `
                                <span style="background: var(--primary); color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-family: monospace;">
                                    ${mech}
                                </span>
                            `).join('')}
                        </div>
                    </div>

                    <h4 style="margin-top: 24px; margin-bottom: 12px; color: var(--text-primary);">
                        <i class="fas fa-code"></i> Examples
                    </h4>
                    <div style="display: grid; gap: 12px;">
                        ${AUDIENCE_EXAMPLES.map(ex => `
                            <div style="background: var(--bg-secondary); border-radius: 6px; padding: 12px;">
                                <strong style="color: var(--primary); font-size: 13px;">${ex.title}</strong>
                                <pre style="background: var(--bg-tertiary); padding: 10px; border-radius: 4px; margin: 8px 0; font-size: 12px; overflow-x: auto;"><code>${ex.code}</code></pre>
                                <p style="margin: 0; font-size: 12px; color: var(--text-tertiary);">${ex.description}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    static showMathHelp() {
        const { MATH_OPERATORS, COMPARISON_OPERATORS, MATH_FUNCTIONS, MATH_EXAMPLES } = window.MathDocumentation || {};
        
        if (!MATH_OPERATORS) {
            console.error('Math documentation not loaded');
            return;
        }

        // Remove any existing modal-overlay to prevent duplicates
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-dialog" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3><i class="fas fa-calculator"></i> Math Operations Reference</h3>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 6px; padding: 12px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: start; gap: 10px;">
                            <i class="fas fa-info-circle" style="color: #10b981; margin-top: 2px; font-size: 20px;"></i>
                            <div style="flex: 1;">
                                <strong style="color: #10b981; font-size: 14px;">Using Math in MythicMobs</strong>
                                <p style="margin: 8px 0 0 0; font-size: 13px; color: var(--text-secondary);">
                                    Math operations work inside placeholder expressions like <code>&lt;caster.hp&gt;</code> or numeric mechanic parameters.
                                    Use them to create dynamic, scaling abilities that respond to mob level, health, or other variables.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="tabs-container" style="margin-bottom: 20px;">
                        <div class="tabs-header" style="display: flex; gap: 4px; border-bottom: 2px solid var(--border-color);">
                            <button class="math-tab-btn active" data-tab="operators" style="padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 6px 6px 0 0; cursor: pointer; font-weight: 500;">
                                Operators
                            </button>
                            <button class="math-tab-btn" data-tab="functions" style="padding: 10px 20px; background: var(--bg-secondary); color: var(--text-secondary); border: none; border-radius: 6px 6px 0 0; cursor: pointer; font-weight: 500;">
                                Functions
                            </button>
                            <button class="math-tab-btn" data-tab="examples" style="padding: 10px 20px; background: var(--bg-secondary); color: var(--text-secondary); border: none; border-radius: 6px 6px 0 0; cursor: pointer; font-weight: 500;">
                                Examples
                            </button>
                        </div>

                        <!-- Operators Tab -->
                        <div class="math-tab-content" data-tab="operators" style="padding: 16px 0;">
                            <h4 style="margin-bottom: 12px; color: var(--text-primary);">
                                <i class="fas fa-plus-minus"></i> Math Operators
                            </h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; margin-bottom: 20px;">
                                ${MATH_OPERATORS.map(op => `
                                    <div class="list-item" style="padding: 10px; background: var(--bg-secondary); border-radius: 6px;">
                                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                                            <code style="background: var(--primary); color: white; padding: 4px 10px; border-radius: 4px; font-size: 16px; font-weight: bold;">${op.symbol}</code>
                                            <strong style="color: var(--text-primary);">${op.name}</strong>
                                        </div>
                                        <p style="margin: 4px 0; font-size: 12px; color: var(--text-secondary);">${op.description}</p>
                                        <code style="display: block; background: var(--bg-tertiary); padding: 6px 8px; border-radius: 4px; font-size: 11px; margin-top: 6px;">${op.example}</code>
                                        <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">→ ${op.result}</div>
                                    </div>
                                `).join('')}
                            </div>

                            <h4 style="margin-top: 20px; margin-bottom: 12px; color: var(--text-primary);">
                                <i class="fas fa-not-equal"></i> Comparison Operators
                            </h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">
                                ${COMPARISON_OPERATORS.map(op => `
                                    <div class="list-item" style="padding: 10px; background: var(--bg-secondary); border-radius: 6px;">
                                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                                            <code style="background: #8b5cf6; color: white; padding: 4px 10px; border-radius: 4px; font-size: 16px; font-weight: bold;">${op.symbol}</code>
                                            <strong style="color: var(--text-primary);">${op.name}</strong>
                                        </div>
                                        <p style="margin: 4px 0; font-size: 12px; color: var(--text-secondary);">${op.description}</p>
                                        <code style="display: block; background: var(--bg-tertiary); padding: 6px 8px; border-radius: 4px; font-size: 11px; margin-top: 6px;">${op.example}</code>
                                        <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">→ ${op.result}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Functions Tab -->
                        <div class="math-tab-content" data-tab="functions" style="padding: 16px 0; display: none;">
                            <h4 style="margin-bottom: 12px; color: var(--text-primary);">
                                <i class="fas fa-function"></i> Math Functions
                            </h4>
                            <div style="display: grid; gap: 12px;">
                                ${MATH_FUNCTIONS.map(fn => `
                                    <div class="list-item" style="padding: 12px; background: var(--bg-secondary); border-radius: 6px;">
                                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                            <strong style="color: var(--primary); font-size: 14px;">${fn.name}()</strong>
                                            <code style="background: var(--bg-tertiary); padding: 2px 8px; border-radius: 4px; font-size: 11px;">${fn.syntax}</code>
                                        </div>
                                        <p style="margin: 4px 0; font-size: 13px; color: var(--text-secondary);">${fn.description}</p>
                                        <div style="display: flex; gap: 12px; margin-top: 8px; font-size: 12px;">
                                            <div style="flex: 1;">
                                                <strong style="color: var(--text-tertiary);">Example:</strong>
                                                <code style="display: block; background: var(--bg-tertiary); padding: 6px 8px; border-radius: 4px; margin-top: 4px;">${fn.example}</code>
                                            </div>
                                            <div style="flex: 1;">
                                                <strong style="color: var(--text-tertiary);">Result:</strong>
                                                <code style="display: block; background: var(--bg-tertiary); padding: 6px 8px; border-radius: 4px; margin-top: 4px;">${fn.result}</code>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Examples Tab -->
                        <div class="math-tab-content" data-tab="examples" style="padding: 16px 0; display: none;">
                            <h4 style="margin-bottom: 12px; color: var(--text-primary);">
                                <i class="fas fa-code"></i> Practical Examples
                            </h4>
                            <div style="display: grid; gap: 12px;">
                                ${MATH_EXAMPLES.map(ex => `
                                    <div style="background: var(--bg-secondary); border-radius: 6px; padding: 12px;">
                                        <strong style="color: var(--primary); font-size: 13px;">${ex.title}</strong>
                                        <pre style="background: var(--bg-tertiary); padding: 10px; border-radius: 4px; margin: 8px 0; font-size: 12px; overflow-x: auto;"><code>${ex.code}</code></pre>
                                        <p style="margin: 0; font-size: 12px; color: var(--text-tertiary);">${ex.description}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add tab switching functionality
        const tabBtns = modal.querySelectorAll('.math-tab-btn');
        const tabContents = modal.querySelectorAll('.math-tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                
                // Update button styles
                tabBtns.forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'var(--bg-secondary)';
                    b.style.color = 'var(--text-secondary)';
                });
                btn.classList.add('active');
                btn.style.background = 'var(--primary)';
                btn.style.color = 'white';

                // Show/hide content
                tabContents.forEach(content => {
                    content.style.display = content.dataset.tab === tabName ? 'block' : 'none';
                });
            });
        });
    }
}

// Export to global scope
window.DocumentationHelper = DocumentationHelper;

// Loaded silently
