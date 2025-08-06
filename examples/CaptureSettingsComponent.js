// Example settings component for Capture/Summarize functionality
// This demonstrates how to integrate the new capture features into a UI

import { html, css, LitElement } from '../src/ui/assets/lit-core-2.7.4.min.js';

export class CaptureSettingsComponent extends LitElement {
    static properties = {
        enableAutoCapture: { type: Boolean, state: true },
        captureInterval: { type: Number, state: true },
        enableNotifications: { type: Boolean, state: true },
        enableSmartAnalysis: { type: Boolean, state: true },
        isTracking: { type: Boolean, state: true },
        loading: { type: Boolean, state: true }
    };

    static styles = css`
        :host {
            display: block;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .settings-section {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 16px;
            backdrop-filter: blur(10px);
        }

        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: white;
            margin-bottom: 12px;
        }

        .setting-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .setting-item:last-child {
            border-bottom: none;
        }

        .setting-label {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
        }

        .setting-description {
            color: rgba(255, 255, 255, 0.6);
            font-size: 12px;
            margin-top: 4px;
        }

        .toggle-switch {
            position: relative;
            width: 44px;
            height: 24px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            cursor: pointer;
            transition: background 0.2s ease;
        }

        .toggle-switch.active {
            background: #4CAF50;
        }

        .toggle-knob {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            transition: transform 0.2s ease;
        }

        .toggle-switch.active .toggle-knob {
            transform: translateX(20px);
        }

        .interval-input {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            padding: 8px 12px;
            color: white;
            width: 80px;
            text-align: center;
        }

        .status-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #4CAF50;
        }

        .status-dot.inactive {
            background: rgba(255, 255, 255, 0.4);
        }

        .action-buttons {
            display: flex;
            gap: 12px;
            margin-top: 16px;
        }

        .btn {
            padding: 10px 16px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
        }

        .btn-primary {
            background: #4CAF50;
            color: white;
        }

        .btn-primary:hover {
            background: #45a049;
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .keyboard-shortcut {
            display: flex;
            align-items: center;
            gap: 8px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 12px;
        }

        .key {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            padding: 2px 6px;
            font-family: monospace;
        }
    `;

    constructor() {
        super();
        this.enableAutoCapture = true;
        this.captureInterval = 15;
        this.enableNotifications = true;
        this.enableSmartAnalysis = true;
        this.isTracking = false;
        this.loading = false;
    }

    async connectedCallback() {
        super.connectedCallback();
        await this.loadSettings();
        this.startStatusPolling();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
        }
    }

    async loadSettings() {
        try {
            this.loading = true;
            
            // Load current capture settings
            const settings = await window.api.invoke('activity:get-capture-settings');
            this.enableAutoCapture = settings.enableAutoCapture;
            this.captureInterval = settings.captureIntervalMinutes;
            this.enableNotifications = settings.manualCaptureNotifications;
            this.enableSmartAnalysis = settings.enableSmartAnalysis;
            
            // Load tracking status
            const status = await window.api.invoke('activity:get-tracking-status');
            this.isTracking = status.isTracking;
            
        } catch (error) {
            console.error('Failed to load capture settings:', error);
        } finally {
            this.loading = false;
        }
    }

    startStatusPolling() {
        // Poll tracking status every 5 seconds
        this.statusInterval = setInterval(async () => {
            try {
                const status = await window.api.invoke('activity:get-tracking-status');
                this.isTracking = status.isTracking;
            } catch (error) {
                console.warn('Failed to poll tracking status:', error);
            }
        }, 5000);
    }

    async toggleAutoCapture() {
        try {
            this.loading = true;
            await window.api.invoke('activity:set-auto-capture-enabled', { 
                enabled: !this.enableAutoCapture 
            });
            this.enableAutoCapture = !this.enableAutoCapture;
        } catch (error) {
            console.error('Failed to toggle auto capture:', error);
        } finally {
            this.loading = false;
        }
    }

    async updateCaptureInterval(event) {
        const value = parseInt(event.target.value);
        if (value >= 1 && value <= 120) {
            try {
                this.loading = true;
                await window.api.invoke('activity:set-capture-interval', { 
                    intervalMinutes: value 
                });
                this.captureInterval = value;
            } catch (error) {
                console.error('Failed to update capture interval:', error);
            } finally {
                this.loading = false;
            }
        }
    }

    async toggleNotifications() {
        try {
            this.loading = true;
            await window.api.invoke('activity:set-notifications-enabled', { 
                enabled: !this.enableNotifications 
            });
            this.enableNotifications = !this.enableNotifications;
        } catch (error) {
            console.error('Failed to toggle notifications:', error);
        } finally {
            this.loading = false;
        }
    }

    async toggleTracking() {
        try {
            this.loading = true;
            if (this.isTracking) {
                await window.api.invoke('activity:stop-tracking');
            } else {
                await window.api.invoke('activity:start-tracking');
            }
            // Status will be updated by polling
        } catch (error) {
            console.error('Failed to toggle tracking:', error);
        } finally {
            this.loading = false;
        }
    }

    async manualCapture() {
        try {
            this.loading = true;
            const result = await window.api.invoke('activity:capture-and-analyze');
            
            if (result.success) {
                console.log('Manual capture successful:', result.summary);
                // Could show a success message here
            } else {
                console.error('Manual capture failed:', result.error);
                // Could show an error message here
            }
        } catch (error) {
            console.error('Failed to perform manual capture:', error);
        } finally {
            this.loading = false;
        }
    }

    render() {
        const isMac = navigator.platform.toLowerCase().includes('mac');
        const captureShortcut = isMac ? 'Cmd+Shift+C' : 'Ctrl+Shift+C';

        return html`
            <div class="settings-section">
                <div class="section-title">Activity Tracking Status</div>
                <div class="setting-item">
                    <div>
                        <div class="setting-label">Activity Tracking</div>
                        <div class="setting-description">
                            ${this.isTracking ? 'Currently tracking your activity' : 'Activity tracking is stopped'}
                        </div>
                    </div>
                    <div class="status-indicator">
                        <div class="status-dot ${this.isTracking ? '' : 'inactive'}"></div>
                        ${this.isTracking ? 'Active' : 'Inactive'}
                    </div>
                </div>
                <div class="action-buttons">
                    <button 
                        class="btn ${this.isTracking ? 'btn-secondary' : 'btn-primary'}"
                        @click=${this.toggleTracking}
                        ?disabled=${this.loading}
                    >
                        ${this.isTracking ? 'Stop Tracking' : 'Start Tracking'}
                    </button>
                </div>
            </div>

            <div class="settings-section">
                <div class="section-title">Automatic Capture Settings</div>
                
                <div class="setting-item">
                    <div>
                        <div class="setting-label">Enable Automatic Capture</div>
                        <div class="setting-description">
                            Automatically capture and analyze screenshots during activity tracking
                        </div>
                    </div>
                    <div 
                        class="toggle-switch ${this.enableAutoCapture ? 'active' : ''}"
                        @click=${this.toggleAutoCapture}
                    >
                        <div class="toggle-knob"></div>
                    </div>
                </div>

                ${this.enableAutoCapture ? html`
                    <div class="setting-item">
                        <div>
                            <div class="setting-label">Capture Interval</div>
                            <div class="setting-description">
                                How often to capture screenshots (minutes)
                            </div>
                        </div>
                        <input 
                            type="number" 
                            class="interval-input"
                            min="1" 
                            max="120"
                            .value=${this.captureInterval}
                            @change=${this.updateCaptureInterval}
                            ?disabled=${this.loading}
                        >
                    </div>
                ` : ''}
            </div>

            <div class="settings-section">
                <div class="section-title">Manual Capture</div>
                
                <div class="setting-item">
                    <div>
                        <div class="setting-label">Manual Capture</div>
                        <div class="setting-description">
                            Capture and analyze current screen instantly
                        </div>
                        <div class="keyboard-shortcut">
                            Shortcut: 
                            ${captureShortcut.split('+').map(key => html`<span class="key">${key}</span>`)}
                        </div>
                    </div>
                    <button 
                        class="btn btn-primary"
                        @click=${this.manualCapture}
                        ?disabled=${this.loading}
                    >
                        Capture Now
                    </button>
                </div>

                <div class="setting-item">
                    <div>
                        <div class="setting-label">Show Notifications</div>
                        <div class="setting-description">
                            Display notifications when manual captures complete
                        </div>
                    </div>
                    <div 
                        class="toggle-switch ${this.enableNotifications ? 'active' : ''}"
                        @click=${this.toggleNotifications}
                    >
                        <div class="toggle-knob"></div>
                    </div>
                </div>
            </div>

            <div class="settings-section">
                <div class="section-title">AI Analysis</div>
                
                <div class="setting-item">
                    <div>
                        <div class="setting-label">Smart Analysis</div>
                        <div class="setting-description">
                            Use AI to analyze and categorize captured content
                        </div>
                    </div>
                    <div class="status-indicator">
                        <div class="status-dot ${this.enableSmartAnalysis ? '' : 'inactive'}"></div>
                        ${this.enableSmartAnalysis ? 'Enabled' : 'Disabled'}
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('capture-settings', CaptureSettingsComponent);