// Research Dashboard Component for Glass UI
import { LitElement, html, css } from 'lit';

class ResearchDashboard extends LitElement {
  static properties = {
    dashboardData: { type: Object },
    isVisible: { type: Boolean },
    isLoading: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      border-radius: 8px;
      padding: 16px;
      margin: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 8px;
    }

    .dashboard-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
    }

    .status-dot.inactive {
      background: #6b7280;
    }

    .current-session {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 16px;
    }

    .session-title {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .session-duration {
      font-size: 14px;
      color: #10b981;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      padding: 12px;
      text-align: center;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 600;
      color: #3b82f6;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: #9ca3af;
      text-transform: uppercase;
    }

    .recent-sessions {
      margin-top: 16px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
      color: #d1d5db;
    }

    .session-list {
      max-height: 150px;
      overflow-y: auto;
    }

    .session-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 14px;
    }

    .session-item:last-child {
      border-bottom: none;
    }

    .session-name {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-right: 8px;
    }

    .session-time {
      color: #9ca3af;
      font-size: 12px;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #9ca3af;
    }

    .toggle-button {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #3b82f6;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 12px;
    }

    .toggle-button:hover {
      background: rgba(59, 130, 246, 0.2);
    }

    .toggle-button.active {
      background: #3b82f6;
      color: white;
    }
  `;

  constructor() {
    super();
    this.dashboardData = null;
    this.isVisible = true;
    this.isLoading = true;
    this.refreshInterval = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadDashboardData();
    this.startAutoRefresh();
    
    // Listen for research session updates
    window.electronAPI?.onResearchSessionUpdate?.(this.handleSessionUpdate.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopAutoRefresh();
  }

  async loadDashboardData() {
    try {
      this.isLoading = true;
      const data = await window.electronAPI?.invoke('research:get-dashboard-data');
      this.dashboardData = data;
    } catch (error) {
      console.error('Failed to load research dashboard data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  handleSessionUpdate(updateData) {
    console.log('Research session update:', updateData);
    // Refresh dashboard data when sessions change
    this.loadDashboardData();
  }

  startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.loadDashboardData();
    }, 30000); // Refresh every 30 seconds
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  async toggleTracking() {
    try {
      const currentSession = this.dashboardData?.currentSession;
      if (currentSession) {
        await window.electronAPI?.invoke('research:stop-tracking');
      } else {
        await window.electronAPI?.invoke('research:start-tracking');
      }
      // Refresh data after toggle
      setTimeout(() => this.loadDashboardData(), 500);
    } catch (error) {
      console.error('Failed to toggle tracking:', error);
    }
  }

  formatDuration(minutes) {
    if (!minutes) return '0m';
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  }

  render() {
    if (!this.isVisible) return html``;

    if (this.isLoading) {
      return html`
        <div class="loading">
          Loading research data...
        </div>
      `;
    }

    if (!this.dashboardData) {
      return html`
        <div class="loading">
          Research tracking not available
        </div>
      `;
    }

    const { currentSession, dailyStats, recentSessions, topPDFs } = this.dashboardData;

    return html`
      <div class="dashboard-header">
        <h3 class="dashboard-title">Research Tracking</h3>
        <div class="status-indicator">
          <div class="status-dot ${currentSession ? '' : 'inactive'}"></div>
          <span>${currentSession ? 'Active' : 'Inactive'}</span>
          <button 
            class="toggle-button ${currentSession ? 'active' : ''}" 
            @click=${this.toggleTracking}
          >
            ${currentSession ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>

      ${currentSession ? html`
        <div class="current-session">
          <div class="session-title">📄 ${currentSession.title}</div>
          <div class="session-duration">
            ${this.formatDuration(currentSession.durationMinutes)} elapsed
          </div>
        </div>
      ` : ''}

      ${dailyStats ? html`
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${dailyStats.session_count || 0}</div>
            <div class="stat-label">Sessions</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.formatDuration(dailyStats.total_minutes)}</div>
            <div class="stat-label">Today</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.formatDuration(dailyStats.avg_session_minutes)}</div>
            <div class="stat-label">Avg Session</div>
          </div>
        </div>
      ` : ''}

      ${recentSessions?.length > 0 ? html`
        <div class="recent-sessions">
          <div class="section-title">Recent Sessions</div>
          <div class="session-list">
            ${recentSessions.slice(0, 5).map(session => html`
              <div class="session-item">
                <div class="session-name">${session.title}</div>
                <div class="session-time">${this.formatDuration(session.duration_minutes)}</div>
              </div>
            `)}
          </div>
        </div>
      ` : ''}
    `;
  }
}

customElements.define('research-dashboard', ResearchDashboard);