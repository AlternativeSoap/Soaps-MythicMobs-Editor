/**
 * Inline Condition Builder Component
 * Advanced feature for building inline conditions with proper syntax
 * Supports: Standard (?), Trigger (?~), and Target (in targeter) inline conditions
 */

class InlineConditionBuilder {
    constructor() {
        this.currentCondition = null;
        this.onSelectCallback = null;
        this.conditionType = 'standard'; // 'standard', 'trigger', 'target'
        this.isNegated = false;
        this.selectedCondition = null;
        this.conditionArgs = {};
        
        this.createModal();
        this.attachEventListeners();
    }

    /**
     * Create the inline condition builder modal
     */
    createModal() {
        const modalHTML = `
            <div id="inlineConditionBuilderOverlay" class="condition-modal" style="display: none;">
                <div class="modal-content condition-browser" style="max-width: 700px;">
                    <div class="modal-header">
                        <h2>Add Inline Condition <span class="advanced-badge">ADVANCED</span></h2>
                        <button class="btn-close" id="inlineConditionBuilderClose">&times;</button>
                    </div>
                    
                    <div class="inline-condition-body">
                        <!-- Info Section -->
                        <div class="info-section">
                            <p><strong>Inline conditions</strong> allow you to add conditions directly to skill lines without creating separate condition files.</p>
                        </div>
                        
                        <!-- Condition Type Selection -->
                        <div class="config-section">
                            <h4>Condition Type <span class="required">*</span></h4>
                            <div class="condition-type-selector">
                                <label class="radio-option">
                                    <input type="radio" name="conditionType" value="standard" checked>
                                    <div class="radio-content">
                                        <strong>Standard (?)</strong>
                                        <small>Checks the caster entity</small>
                                    </div>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="conditionType" value="trigger">
                                    <div class="radio-content">
                                        <strong>Trigger (?~)</strong>
                                        <small>Checks the trigger entity (e.g., player who hit the mob)</small>
                                    </div>
                                </label>
                                <label class="radio-option premium-feature">
                                    <input type="radio" name="conditionType" value="target">
                                    <div class="radio-content">
                                        <strong>Target (in targeter)</strong>
                                        <small>⭐ Premium Only - Filters targets by condition</small>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Negation Toggle -->
                        <div class="config-section">
                            <label class="checkbox-option">
                                <input type="checkbox" id="negateCondition">
                                <span>Negate condition (apply when false)</span>
                            </label>
                        </div>
                        
                        <!-- Condition Selection -->
                        <div class="config-section">
                            <h4>Select Condition <span class="required">*</span></h4>
                            <button class="btn btn-secondary btn-select-component" id="selectInlineConditionBtn">
                                <i class="fas fa-filter"></i> <span id="inlineConditionDisplay">Choose Condition...</span>
                            </button>
                        </div>
                        
                        <!-- Condition Attributes (rendered dynamically) -->
                        <div class="config-section" id="inlineConditionAttributesSection" style="display: none;">
                            <h4>Condition Attributes</h4>
                            <div id="inlineConditionAttributesForm">
                                <!-- Attributes will be rendered here -->
                            </div>
                        </div>
                        
                        <!-- Context Warnings -->
                        <div id="contextWarnings" class="warnings-section" style="display: none;">
                            <!-- Warnings will be inserted here -->
                        </div>
                        
                        <!-- Live Preview -->
                        <div class="config-section preview-section">
                            <h4>Preview</h4>
                            <div class="skill-line-preview">
                                <code id="inlineConditionPreview">?condition</code>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancelInlineCondition">Cancel</button>
                        <button class="btn btn-primary" id="confirmInlineCondition">Add Condition</button>
                    </div>
                </div>
            </div>
        `;

        const temp = document.createElement('div');
        temp.innerHTML = modalHTML;
        document.body.appendChild(temp.firstElementChild);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close modal
        document.getElementById('inlineConditionBuilderClose').addEventListener('click', () => {
            this.close();
        });

        document.getElementById('inlineConditionBuilderOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'inlineConditionBuilderOverlay') {
                this.close();
            }
        });

        // Cancel button
        document.getElementById('cancelInlineCondition').addEventListener('click', () => {
            this.close();
        });

        // Confirm button
        document.getElementById('confirmInlineCondition').addEventListener('click', () => {
            this.confirmCondition();
        });

        // Condition type selection
        document.querySelectorAll('input[name="conditionType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.conditionType = e.target.value;
                this.updateWarnings();
                this.updatePreview();
            });
        });

        // Negation toggle
        document.getElementById('negateCondition').addEventListener('change', (e) => {
            this.isNegated = e.target.checked;
            this.updatePreview();
        });

        // Select condition button
        document.getElementById('selectInlineConditionBtn').addEventListener('click', () => {
            this.openConditionBrowser();
        });

        // ESC key
        document.addEventListener('keydown', (e) => {
            const overlay = document.getElementById('inlineConditionBuilderOverlay');
            if (e.key === 'Escape' && overlay && overlay.style.display === 'flex') {
                this.close();
            }
        });
    }

    /**
     * Open the inline condition builder
     */
    open(options = {}) {
        this.onSelectCallback = options.onSelect || null;
        this.context = options.context || {}; // { hasTrigger: boolean, targeter: string }
        
        // Reset state
        this.conditionType = 'standard';
        this.isNegated = false;
        this.selectedCondition = null;
        this.conditionArgs = {};
        
        // Reset UI
        document.querySelector('input[name="conditionType"][value="standard"]').checked = true;
        document.getElementById('negateCondition').checked = false;
        document.getElementById('inlineConditionDisplay').textContent = 'Choose Condition...';
        document.getElementById('inlineConditionAttributesSection').style.display = 'none';
        document.getElementById('contextWarnings').style.display = 'none';
        
        this.updateWarnings();
        this.updatePreview();
        
        const overlay = document.getElementById('inlineConditionBuilderOverlay');
        if (options.parentZIndex) {
            overlay.style.zIndex = options.parentZIndex + 100;
        } else {
            overlay.style.zIndex = '';
        }
        overlay.style.display = 'flex';
    }

    /**
     * Close the inline condition builder
     */
    close() {
        const overlay = document.getElementById('inlineConditionBuilderOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        if (this.onSelectCallback) {
            this.onSelectCallback(null);
        }
        
        this.onSelectCallback = null;
    }

    /**
     * Open condition browser to select a condition
     */
    openConditionBrowser() {
        if (!window.conditionBrowser) {
            window.conditionBrowser = new ConditionBrowser();
        }
        
        window.conditionBrowser.open({
            parentZIndex: 20000,
            onSelect: (conditionString) => {
                if (conditionString) {
                    // Parse the condition string to extract name and attributes
                    const match = conditionString.match(/(\w+)(?:\{([^}]+)\})?/);
                    if (match) {
                        const conditionName = match[1];
                        
                        // Find condition in data
                        const allConditions = window.ALL_CONDITIONS || [];
                        this.selectedCondition = allConditions.find(c => c.name === conditionName);
                        
                        if (this.selectedCondition) {
                            document.getElementById('inlineConditionDisplay').textContent = this.selectedCondition.name;
                            this.renderConditionAttributes();
                            this.updatePreview();
                        }
                    }
                }
            }
        });
    }

    /**
     * Render condition attribute inputs
     */
    renderConditionAttributes() {
        const container = document.getElementById('inlineConditionAttributesForm');
        const section = document.getElementById('inlineConditionAttributesSection');
        
        if (!this.selectedCondition || !this.selectedCondition.attributes || this.selectedCondition.attributes.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        container.innerHTML = '';
        this.conditionArgs = {};
        
        this.selectedCondition.attributes.forEach(attr => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            
            const label = document.createElement('label');
            label.textContent = attr.name;
            if (attr.required) {
                label.innerHTML += ' <span class="required">*</span>';
            }
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-input inline-condition-attr-input';
            input.dataset.attr = attr.name;
            input.placeholder = attr.default || '';
            input.title = attr.description || '';
            
            if (attr.description) {
                const small = document.createElement('small');
                small.textContent = attr.description;
                formGroup.appendChild(label);
                formGroup.appendChild(input);
                formGroup.appendChild(small);
            } else {
                formGroup.appendChild(label);
                formGroup.appendChild(input);
            }
            
            // Live preview update
            input.addEventListener('input', () => {
                this.updatePreview();
            });
            
            container.appendChild(formGroup);
        });
    }

    /**
     * Update context warnings based on condition type
     */
    updateWarnings() {
        const warningsContainer = document.getElementById('contextWarnings');
        const warnings = [];
        
        if (this.conditionType === 'trigger' && !this.context.hasTrigger) {
            warnings.push({
                level: 'warning',
                message: '⚠️ Trigger conditions require a trigger (~) to be set on the skill line.'
            });
        }
        
        if (this.conditionType === 'target') {
            warnings.push({
                level: 'info',
                message: '⭐ Target conditions require MythicMobs Premium and are embedded in the targeter.'
            });
            warnings.push({
                level: 'info',
                message: '📝 Syntax: @Targeter{conditions=[  - condition true ]}'
            });
        }
        
        if (warnings.length > 0) {
            warningsContainer.style.display = 'block';
            warningsContainer.innerHTML = warnings.map(w => `
                <div class="warning-message ${w.level}">
                    ${w.message}
                </div>
            `).join('');
        } else {
            warningsContainer.style.display = 'none';
        }
    }

    /**
     * Update preview of the inline condition
     */
    updatePreview() {
        const previewElement = document.getElementById('inlineConditionPreview');
        
        if (!this.selectedCondition) {
            previewElement.textContent = '?condition';
            return;
        }
        
        let preview = '';
        
        // Build prefix
        if (this.conditionType === 'standard') {
            preview = this.isNegated ? '?!' : '?';
        } else if (this.conditionType === 'trigger') {
            preview = this.isNegated ? '?~!' : '?~';
        } else if (this.conditionType === 'target') {
            preview = '(embedded in targeter) ';
        }
        
        // Add condition name
        preview += this.selectedCondition.name;
        
        // Collect arguments
        const args = {};
        const inputs = document.querySelectorAll('.inline-condition-attr-input');
        inputs.forEach(input => {
            const value = input.value.trim();
            if (value) {
                args[input.dataset.attr] = value;
            }
        });
        
        // Add arguments to preview
        if (Object.keys(args).length > 0) {
            const argsStr = Object.entries(args)
                .map(([key, value]) => `${key}=${value}`)
                .join(';');
            preview += `{${argsStr}}`;
        }
        
        // For target conditions, show full targeter syntax
        if (this.conditionType === 'target') {
            const actionValue = this.isNegated ? 'false' : 'true';
            preview = `@Targeter{conditions=[  - ${this.selectedCondition.name}`;
            if (Object.keys(args).length > 0) {
                const argsStr = Object.entries(args)
                    .map(([key, value]) => `${key}=${value}`)
                    .join(';');
                preview += `{${argsStr}}`;
            }
            preview += ` ${actionValue} ]}`;
        }
        
        previewElement.textContent = preview;
    }

    /**
     * Confirm and return the inline condition
     */
    confirmCondition() {
        if (!this.selectedCondition) {
            window.notificationModal?.alert(
                'Please select a condition first.',
                'warning',
                'No Condition Selected'
            );
            return;
        }
        
        // Build condition object
        const condition = {
            name: this.selectedCondition.name,
            type: this.conditionType,
            negated: this.isNegated,
            args: {}
        };
        
        // Collect arguments
        const inputs = document.querySelectorAll('.inline-condition-attr-input');
        inputs.forEach(input => {
            const value = input.value.trim();
            if (value) {
                condition.args[input.dataset.attr] = value;
            }
        });
        
        // Build inline condition string
        let conditionString = '';
        
        if (this.conditionType === 'standard') {
            conditionString = this.isNegated ? '?!' : '?';
        } else if (this.conditionType === 'trigger') {
            conditionString = this.isNegated ? '?~!' : '?~';
        } else if (this.conditionType === 'target') {
            // Target conditions are handled differently
            conditionString = 'TARGET:';
        }
        
        conditionString += this.selectedCondition.name;
        
        if (Object.keys(condition.args).length > 0) {
            const argsStr = Object.entries(condition.args)
                .map(([key, value]) => `${key}=${value}`)
                .join(';');
            conditionString += `{${argsStr}}`;
        }
        
        // Call callback with condition
        if (this.onSelectCallback) {
            this.onSelectCallback({
                condition: condition,
                conditionString: conditionString,
                preview: document.getElementById('inlineConditionPreview').textContent
            });
        }
        
        // Close modal
        const overlay = document.getElementById('inlineConditionBuilderOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InlineConditionBuilder;
}
