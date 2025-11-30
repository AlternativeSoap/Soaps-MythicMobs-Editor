/**
 * BossBarEditor - Component for editing MythicMobs BossBar configuration
 * Provides UI for BossBar health display customization
 */

class BossBarEditor {
    constructor(containerId, mob = null) {
        this.containerId = containerId;
        this.mob = mob || {};
        this.bossBar = mob?.bossBar || {
            enabled: false,
            title: '[name]',
            range: 50,
            color: 'PURPLE',
            style: 'SOLID',
            createFog: false,
            darkenSky: false,
            playMusic: false
        };
        this.onChangeCallback = null;
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="bossbar-editor">
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="bossbar-enabled" ${this.bossBar.enabled ? 'checked' : ''}>
                        <span>Enable BossBar</span>
                    </label>
                    <small class="form-hint">Display a dragon/wither-style health bar above the mob</small>
                </div>

                <div id="bossbar-config" class="${!this.bossBar.enabled ? 'hidden' : ''}">
                    <div class="form-group">
                        <label class="form-label">Title</label>
                        <input type="text" id="bossbar-title" class="form-input" 
                               value="${this.bossBar.title}" 
                               placeholder="[name]">
                        <small class="form-hint">Text displayed on the boss bar. Use [name] for mob name.</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Range (blocks)</label>
                        <input type="number" id="bossbar-range" class="form-input" 
                               value="${this.bossBar.range}" min="1" max="256">
                        <small class="form-hint">Distance at which players can see the boss bar (1-256)</small>
                    </div>

                    <div class="form-row">
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label">Color</label>
                            <select id="bossbar-color" class="form-input">
                                ${BOSSBAR_COLORS.map(c => 
                                    `<option value="${c.value}" ${this.bossBar.color === c.value ? 'selected' : ''}>
                                        ${c.label}
                                    </option>`
                                ).join('')}
                            </select>
                        </div>

                        <div class="form-group" style="flex: 1;">
                            <label class="form-label">Style</label>
                            <select id="bossbar-style" class="form-input">
                                ${BOSSBAR_STYLES.map(s => 
                                    `<option value="${s.value}" ${this.bossBar.style === s.value ? 'selected' : ''}>
                                        ${s.label}
                                    </option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="bossbar-preview" id="bossbar-preview">
                        <div class="bossbar-preview-container">
                            <div class="bossbar-preview-title">${this.bossBar.title}</div>
                            <div class="bossbar-preview-bar" style="background-color: ${this.getColorHex(this.bossBar.color)}">
                                ${this.renderStyleSegments()}
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Visual Effects</label>
                        <div class="checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="bossbar-createfog" ${this.bossBar.createFog ? 'checked' : ''}>
                                <span>Create Fog</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="bossbar-darkensky" ${this.bossBar.darkenSky ? 'checked' : ''}>
                                <span>Darken Sky</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="bossbar-playmusic" ${this.bossBar.playMusic ? 'checked' : ''}>
                                <span>Play Boss Music</span>
                            </label>
                        </div>
                        <small class="form-hint">Additional atmospheric effects for players in range</small>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    renderStyleSegments() {
        const style = this.bossBar.style;
        if (style === 'SOLID') {
            return '<div class="bossbar-segment" style="width: 100%"></div>';
        }
        
        const segmentCount = parseInt(style.split('_')[1]) || 6;
        const segmentWidth = 100 / segmentCount;
        let html = '';
        
        for (let i = 0; i < segmentCount; i++) {
            html += `<div class="bossbar-segment" style="width: ${segmentWidth - 0.5}%; margin-right: 0.5%"></div>`;
        }
        
        return html;
    }

    getColorHex(colorName) {
        const color = BOSSBAR_COLORS.find(c => c.value === colorName);
        return color ? color.hex : '#AA00AA';
    }

    attachEventListeners() {
        const enabledCheckbox = document.getElementById('bossbar-enabled');
        const config = document.getElementById('bossbar-config');
        
        enabledCheckbox?.addEventListener('change', (e) => {
            this.bossBar.enabled = e.target.checked;
            config?.classList.toggle('hidden', !e.target.checked);
            this.triggerChange();
        });

        // Title
        document.getElementById('bossbar-title')?.addEventListener('input', (e) => {
            this.bossBar.title = e.target.value;
            this.updatePreview();
            this.triggerChange();
        });

        // Range
        document.getElementById('bossbar-range')?.addEventListener('input', (e) => {
            this.bossBar.range = parseInt(e.target.value) || 50;
            this.triggerChange();
        });

        // Color
        document.getElementById('bossbar-color')?.addEventListener('change', (e) => {
            this.bossBar.color = e.target.value;
            this.updatePreview();
            this.triggerChange();
        });

        // Style
        document.getElementById('bossbar-style')?.addEventListener('change', (e) => {
            this.bossBar.style = e.target.value;
            this.updatePreview();
            this.triggerChange();
        });

        // Visual effects
        document.getElementById('bossbar-createfog')?.addEventListener('change', (e) => {
            this.bossBar.createFog = e.target.checked;
            this.triggerChange();
        });

        document.getElementById('bossbar-darkensky')?.addEventListener('change', (e) => {
            this.bossBar.darkenSky = e.target.checked;
            this.triggerChange();
        });

        document.getElementById('bossbar-playmusic')?.addEventListener('change', (e) => {
            this.bossBar.playMusic = e.target.checked;
            this.triggerChange();
        });
    }

    updatePreview() {
        const preview = document.getElementById('bossbar-preview');
        if (!preview) return;

        const titleEl = preview.querySelector('.bossbar-preview-title');
        const barEl = preview.querySelector('.bossbar-preview-bar');

        if (titleEl) titleEl.textContent = this.bossBar.title;
        if (barEl) {
            barEl.style.backgroundColor = this.getColorHex(this.bossBar.color);
            barEl.innerHTML = this.renderStyleSegments();
        }
    }

    getValue() {
        return this.bossBar;
    }

    setValue(bossBar) {
        this.bossBar = bossBar || {
            enabled: false,
            title: '[name]',
            range: 50,
            color: 'PURPLE',
            style: 'SOLID',
            createFog: false,
            darkenSky: false,
            playMusic: false
        };
        this.render();
    }

    onChange(callback) {
        this.onChangeCallback = callback;
    }

    triggerChange() {
        if (this.onChangeCallback) {
            this.onChangeCallback(this.bossBar);
        }
    }
}
