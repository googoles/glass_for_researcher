import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';

export class MoreActionsView extends LitElement {
    static properties = {
        activityTrackingStatus: { type: Boolean, state: true },
        isCapturing: { type: Boolean, state: true }
    };

    static styles = css`
        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: default;
            user-select: none;
        }

        :host {
            display: block;
            width: 240px;
            height: 100%;
            color: white;
        }

        .more-actions-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            background: rgba(20, 20, 20, 0.8);
            border-radius: 12px;
            outline: 0.5px rgba(255, 255, 255, 0.2) solid;
            outline-offset: -1px;
            box-sizing: border-box;
            position: relative;
            overflow-y: auto;
            padding: 12px 12px;
            z-index: 1000;
        }

        .more-actions-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.15);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            filter: blur(10px);
            z-index: -1;
        }

        .more-actions-container::-webkit-scrollbar {
            width: 6px;
        }

        .more-actions-container::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
        }

        .more-actions-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
        }

        .more-actions-container::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .action-item {
            display: flex;
            align-items: center;
            padding: 5px 10px;
            margin: 2px 0;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.15s ease;
            color: white;
            font-size: 11px;
            font-weight: 400;
            gap: 8px;
            justify-content: flex-start;
            white-space: nowrap;
        }

        .action-item:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.3);
        }

        .action-item:active {
            transform: translateY(1px);
        }

        .action-item.disabled {
            opacity: 0.4;
            cursor: not-allowed;
            pointer-events: none;
        }

        .action-item.disabled:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
        }

        .action-icon {
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .action-icon svg {
            width: 14px;
            height: 14px;
        }

        .action-text {
            flex: 1;
            font-weight: 400;
        }

        .status-indicator {
            font-size: 9px;
            color: rgba(255, 255, 255, 0.6);
            padding: 2px 6px;
            border-radius: 2px;
            margin-left: 6px;
        }

        .status-indicator.active {
            background: rgba(0, 255, 0, 0.2);
            color: rgba(0, 255, 0, 0.8);
        }

        .divider {
            height: 1px;
            background: rgba(255, 255, 255, 0.1);
            margin: 6px 0;
        }

        .loading-spinner {
            width: 12px;
            height: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-top: 1px solid rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* ────────────────[ GLASS BYPASS ]─────────────── */
        :host-context(body.has-glass) {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            will-change: auto !important;
        }

        :host-context(body.has-glass) * {
            background: transparent !important;
            filter: none !important;
            backdrop-filter: none !important;
            box-shadow: none !important;
            outline: none !important;
            border: none !important;
            border-radius: 0 !important;
            transition: none !important;
            animation: none !important;
        }

        :host-context(body.has-glass) .more-actions-container::before {
            display: none !important;
        }
    `;

    constructor() {
        super();
        this.activityTrackingStatus = false;
        this.isCapturing = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.setupEventListeners();
        
        if (window.api) {
            // Get initial activity tracking status
            window.api.invoke('activity:get-tracking-status').then(status => {
                this.activityTrackingStatus = status.isTracking || false;
            }).catch(err => console.warn('Failed to get activity status:', err));
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.cleanupEventListeners();
    }

    setupEventListeners() {
        this.addEventListener('mouseenter', this.handleMouseEnter);
        this.addEventListener('mouseleave', this.handleMouseLeave);
    }

    cleanupEventListeners() {
        this.removeEventListener('mouseenter', this.handleMouseEnter);
        this.removeEventListener('mouseleave', this.handleMouseLeave);
    }

    handleMouseEnter = () => {
        if (window.api && window.api.mainHeader) {
            window.api.mainHeader.cancelHideMoreActionsWindow();
        }
    }

    handleMouseLeave = () => {
        if (window.api && window.api.mainHeader) {
            window.api.mainHeader.hideMoreActionsWindow();
        }
    }

    async _handleActivityTrackingToggle() {
        try {
            if (window.api) {
                const result = this.activityTrackingStatus 
                    ? await window.api.invoke('activity:stop-tracking')
                    : await window.api.invoke('activity:start-tracking');
                
                if (result.success) {
                    this.activityTrackingStatus = !this.activityTrackingStatus;
                }
            }
        } catch (error) {
            console.error('Failed to toggle activity tracking:', error);
        }
    }

    async _handleCaptureAndAnalyze() {
        if (this.isCapturing) return;

        this.isCapturing = true;
        try {
            if (window.api) {
                const result = await window.api.invoke('activity:capture-screenshot');
                if (result.success) {
                    // Optionally show a brief success feedback
                    setTimeout(() => {
                        this.isCapturing = false;
                    }, 1000);
                } else {
                    this.isCapturing = false;
                }
            }
        } catch (error) {
            console.error('Failed to capture and analyze:', error);
            this.isCapturing = false;
        }
    }

    async _handleGenerateSummary() {
        try {
            if (window.api) {
                await window.api.invoke('activity:generate-insights', { timeframe: 'today' });
                console.log('Summary generated successfully');
            }
        } catch (error) {
            console.error('Failed to generate summary:', error);
        }
    }

    render() {
        return html`
            <div class="more-actions-container">
                <div class="action-item" @click=${this._handleActivityTrackingToggle}>
                    <div class="action-icon">
                        ${this.activityTrackingStatus ? html`
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        ` : html`
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                <path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        `}
                    </div>
                    <div class="action-text">
                        ${this.activityTrackingStatus ? 'Stop Activity Tracking' : 'Start Activity Tracking'}
                    </div>
                    <div class="status-indicator ${this.activityTrackingStatus ? 'active' : ''}">
                        ${this.activityTrackingStatus ? 'ON' : 'OFF'}
                    </div>
                </div>

                <div class="action-item ${this.isCapturing ? 'disabled' : ''}" @click=${this._handleCaptureAndAnalyze}>
                    <div class="action-icon">
                        ${this.isCapturing ? html`
                            <div class="loading-spinner"></div>
                        ` : html`
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" fill="none"/>
                                <circle cx="12" cy="13" r="4" stroke="currentColor" stroke-width="2" fill="none"/>
                            </svg>
                        `}
                    </div>
                    <div class="action-text">
                        ${this.isCapturing ? 'Capturing...' : 'Capture & Analyze'}
                    </div>
                </div>

                <div class="action-item" @click=${this._handleGenerateSummary}>
                    <div class="action-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
                            <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"/>
                            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2"/>
                            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2"/>
                            <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <div class="action-text">Generate Summary</div>
                </div>

                <div class="divider"></div>

                <div class="action-item" @click=${() => this._handleHideWindow()}>
                    <div class="action-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6 6 18" stroke="currentColor" stroke-width="2"/>
                            <path d="m6 6 12 12" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <div class="action-text">Close</div>
                </div>
            </div>
        `;
    }

    _handleHideWindow() {
        if (window.api) {
            window.api.mainHeader.hideMoreActionsWindow();
        }
    }
}

customElements.define('more-actions-view', MoreActionsView);