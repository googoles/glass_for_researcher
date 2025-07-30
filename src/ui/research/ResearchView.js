import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';

export class ResearchView extends LitElement {
    static styles = css`
        :host {
            display: block;
            width: 100%;
            height: 100%;
            color: var(--text-color);
            background: var(--background-color);
            padding: 20px;
            box-sizing: border-box;
            overflow-y: auto;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 16px;
        }

        .title {
            font-size: 24px;
            font-weight: 600;
            margin: 0;
        }

        .subtitle {
            font-size: 14px;
            opacity: 0.7;
            margin-top: 4px;
        }

        .tracking-button {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            background: var(--accent-color, #007AFF);
            color: white;
            font-size: 14px;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .tracking-button:hover {
            background: var(--accent-color-hover, #0056CC);
        }

        .tracking-button.stop {
            background: #FF3B30;
        }

        .tracking-button.stop:hover {
            background: #D70015;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }

        .stat-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 16px;
        }

        .stat-label {
            font-size: 12px;
            opacity: 0.7;
            margin-bottom: 4px;
        }

        .stat-value {
            font-size: 20px;
            font-weight: 600;
        }

        .stat-subtitle {
            font-size: 12px;
            opacity: 0.6;
            margin-top: 2px;
        }

        .content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }

        .section {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 20px;
        }

        .section-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
        }

        .session-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .session-item:last-child {
            border-bottom: none;
        }

        .session-info {
            flex: 1;
        }

        .session-title {
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
        }

        .session-details {
            font-size: 12px;
            opacity: 0.7;
        }

        .session-time {
            font-size: 12px;
            opacity: 0.6;
        }

        .empty-state {
            text-align: center;
            padding: 40px 20px;
            opacity: 0.6;
        }

        .loading {
            text-align: center;
            padding: 40px 20px;
            opacity: 0.7;
        }

        .error {
            background: rgba(255, 59, 48, 0.1);
            border: 1px solid rgba(255, 59, 48, 0.2);
            color: #FF3B30;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 16px;
        }

        @media (max-width: 768px) {
            .content-grid {
                grid-template-columns: 1fr;
            }
        }
    `;

    static properties = {
        status: { type: Object },
        sessions: { type: Array },
        pdfs: { type: Array },
        dailyStats: { type: Object },
        loading: { type: Boolean },
        error: { type: String }
    };

    constructor() {
        super();
        this.status = null;
        this.sessions = [];
        this.pdfs = [];
        this.dailyStats = null;
        this.loading = true;
        this.error = null;
        this.refreshInterval = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadData();
        // Refresh data every 30 seconds
        this.refreshInterval = setInterval(() => this.loadData(), 30000);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }

    async loadData() {
        try {
            this.loading = true;
            this.error = null;

            // Get research status
            const status = await window.api.research.getStatus();
            this.status = status;

            // Get dashboard data
            const dashboardData = await window.api.research.getDashboardData();
            if (dashboardData) {
                this.sessions = dashboardData.recentSessions || [];
                this.dailyStats = dashboardData.dailyStats || null;
                this.pdfs = dashboardData.recentPdfs || [];
            }

            this.loading = false;
            this.requestUpdate();
        } catch (error) {
            console.error('Failed to load research data:', error);
            this.error = 'Failed to load research data';
            this.loading = false;
            this.requestUpdate();
        }
    }

    async toggleTracking() {
        try {
            if (this.status?.isTracking) {
                await window.api.research.stopTracking();
            } else {
                await window.api.research.startTracking();
            }
            await this.loadData();
        } catch (error) {
            console.error('Failed to toggle tracking:', error);
            this.error = 'Failed to toggle tracking';
            this.requestUpdate();
        }
    }

    formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            const remainingMinutes = minutes % 60;
            return `${hours}h ${remainingMinutes}m`;
        }
        return `${minutes}m`;
    }

    formatTime(dateString) {
        return new Date(dateString).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    getCurrentSessionDuration() {
        if (!this.status?.currentSession) return 0;
        return Date.now() - new Date(this.status.currentSession.start_time).getTime();
    }

    renderStatsCard(label, value, subtitle) {
        return html`
            <div class="stat-card">
                <div class="stat-label">${label}</div>
                <div class="stat-value">${value}</div>
                ${subtitle ? html`<div class="stat-subtitle">${subtitle}</div>` : ''}
            </div>
        `;
    }

    renderSessionItem(session) {
        return html`
            <div class="session-item">
                <div class="session-info">
                    <div class="session-title">${session.title}</div>
                    <div class="session-details">
                        ${this.formatTime(session.start_time)} • ${this.formatDuration(session.duration_ms)}
                    </div>
                </div>
                <div class="session-time">${this.formatDate(session.start_time)}</div>
            </div>
        `;
    }

    renderPdfItem(pdf) {
        return html`
            <div class="session-item">
                <div class="session-info">
                    <div class="session-title">${pdf.title || pdf.filename}</div>
                    <div class="session-details">
                        Total: ${this.formatDuration(pdf.total_read_time_ms)}
                    </div>
                </div>
                <div class="session-time">${this.formatDate(pdf.last_read_at)}</div>
            </div>
        `;
    }

    render() {
        if (this.loading) {
            return html`
                <div class="loading">
                    <div>Loading research data...</div>
                </div>
            `;
        }

        return html`
            ${this.error ? html`
                <div class="error">
                    ${this.error}
                    <button @click=${this.loadData} style="margin-left: 16px; padding: 4px 8px; background: transparent; border: 1px solid currentColor; border-radius: 4px; color: inherit; cursor: pointer;">
                        Retry
                    </button>
                </div>
            ` : ''}

            <div class="header">
                <div>
                    <h1 class="title">Research Tracking</h1>
                    <div class="subtitle">Track your PDF reading sessions and research progress</div>
                </div>
                
                ${this.status ? html`
                    <button 
                        class="tracking-button ${this.status.isTracking ? 'stop' : ''}"
                        @click=${this.toggleTracking}
                    >
                        ${this.status.isTracking ? '⏸ Stop Tracking' : '▶ Start Tracking'}
                    </button>
                ` : ''}
            </div>

            <div class="stats-grid">
                ${this.renderStatsCard(
                    'Current Session',
                    this.status?.currentSession ? 
                        this.formatDuration(this.getCurrentSessionDuration()) : '—',
                    this.status?.currentSession ? 
                        this.status.currentSession.title : 'No active session'
                )}

                ${this.renderStatsCard(
                    "Today's Reading",
                    this.dailyStats ? 
                        this.formatDuration(this.dailyStats.total_reading_time_ms) : '—',
                    this.dailyStats ? 
                        `${this.dailyStats.total_sessions} sessions` : 'No data'
                )}

                ${this.renderStatsCard(
                    'PDFs Read',
                    this.dailyStats?.pdfs_read || 0,
                    'Today'
                )}

                ${this.renderStatsCard(
                    'Avg Session',
                    this.dailyStats ? 
                        this.formatDuration(this.dailyStats.average_session_length_ms) : '—',
                    'Length'
                )}
            </div>

            <div class="content-grid">
                <div class="section">
                    <h2 class="section-title">Recent Sessions</h2>
                    ${this.sessions.length > 0 ? 
                        this.sessions.map(session => this.renderSessionItem(session)) :
                        html`<div class="empty-state">No recent sessions</div>`
                    }
                </div>

                <div class="section">
                    <h2 class="section-title">Recent PDFs</h2>
                    ${this.pdfs.length > 0 ? 
                        this.pdfs.map(pdf => this.renderPdfItem(pdf)) :
                        html`<div class="empty-state">No PDFs tracked yet</div>`
                    }
                </div>
            </div>
        `;
    }
}

customElements.define('research-view', ResearchView);