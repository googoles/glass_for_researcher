const researchRepository = require('../repositories');

/**
 * AnalyticsService aggregates and analyzes research data
 * to provide insights and productivity metrics
 */
class AnalyticsService {
  constructor() {
    this.aggregationCache = new Map();
  }

  async initialize() {
    console.log('[Analytics Service] Initialized');
    
    // Setup periodic cache cleanup
    setInterval(() => {
      this.cleanupCache();
    }, 300000); // Clean every 5 minutes
  }

  /**
   * Generate comprehensive analytics for research activities
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} Analytics data
   */
  async generateAnalytics(options = {}) {
    const {
      timeframe = '7d',
      projectId = null,
      includeSessions = true,
      includeProductivity = true,
      includeInsights = true
    } = options;

    try {
      const analytics = {
        timeframe,
        project_id: projectId,
        generated_at: new Date().toISOString()
      };

      // Get time boundaries
      const timeBounds = this.getTimeBounds(timeframe);
      
      if (includeSessions) {
        analytics.sessions = await this.getSessionAnalytics(timeBounds, projectId);
      }

      if (includeProductivity) {
        analytics.productivity = await this.getProductivityAnalytics(timeBounds, projectId);
      }

      if (includeInsights) {
        analytics.insights = await this.generateInsights(analytics);
      }

      return analytics;
    } catch (error) {
      console.error('[Analytics Service] Failed to generate analytics:', error);
      return null;
    }
  }

  /**
   * Get session analytics for time period
   * @private
   */
  async getSessionAnalytics(timeBounds, projectId) {
    try {
      const sessions = await researchRepository.getSessionsInRange(
        timeBounds.start,
        timeBounds.end,
        projectId
      );

      const completedSessions = sessions.filter(s => s.end_time);
      const totalDuration = completedSessions.reduce((sum, s) => sum + (s.duration_ms || 0), 0);

      // Group sessions by day
      const sessionsByDay = this.groupSessionsByDay(sessions);
      
      // Calculate trends
      const dailyTrends = this.calculateDailyTrends(sessionsByDay);

      return {
        total_sessions: sessions.length,
        completed_sessions: completedSessions.length,
        total_duration_ms: totalDuration,
        avg_session_duration_ms: completedSessions.length > 0 
          ? totalDuration / completedSessions.length 
          : 0,
        sessions_by_day: sessionsByDay,
        daily_trends: dailyTrends,
        most_productive_day: this.findMostProductiveDay(sessionsByDay),
        session_patterns: this.analyzeSessionPatterns(sessions)
      };
    } catch (error) {
      console.error('[Analytics Service] Failed to get session analytics:', error);
      return null;
    }
  }

  /**
   * Get productivity analytics for time period
   * @private
   */
  async getProductivityAnalytics(timeBounds, projectId) {
    try {
      const analyses = await researchRepository.getAnalysisInRange(
        timeBounds.start,
        timeBounds.end,
        projectId
      );

      if (analyses.length === 0) {
        return {
          avg_productivity: 0,
          productivity_trend: 'insufficient_data',
          focus_quality_distribution: {},
          activity_type_distribution: {},
          hourly_productivity: {}
        };
      }

      // Calculate productivity metrics
      const productivityScores = analyses.map(a => a.productivity_score || 0);
      const avgProductivity = productivityScores.reduce((sum, score) => sum + score, 0) / productivityScores.length;

      // Analyze trends
      const productivityTrend = this.calculateProductivityTrend(analyses);
      
      // Focus quality distribution
      const focusQualityDistribution = this.calculateDistribution(analyses, 'focus_quality');
      
      // Activity type distribution
      const activityTypeDistribution = this.calculateDistribution(analyses, 'activity_type');

      // Hourly productivity patterns
      const hourlyProductivity = this.calculateHourlyProductivity(analyses);

      return {
        avg_productivity: Math.round(avgProductivity * 100) / 100,
        productivity_trend: productivityTrend,
        focus_quality_distribution: focusQualityDistribution,
        activity_type_distribution: activityTypeDistribution,
        hourly_productivity: hourlyProductivity,
        peak_performance_hours: this.findPeakPerformanceHours(hourlyProductivity),
        distraction_patterns: this.analyzeDistractionPatterns(analyses)
      };
    } catch (error) {
      console.error('[Analytics Service] Failed to get productivity analytics:', error);
      return null;
    }
  }

  /**
   * Generate insights from analytics data
   * @private
   */
  async generateInsights(analytics) {
    const insights = [];

    try {
      // Session insights
      if (analytics.sessions) {
        if (analytics.sessions.total_sessions === 0) {
          insights.push({
            type: 'warning',
            category: 'sessions',
            title: 'No Research Activity',
            message: 'No research sessions detected in this timeframe.',
            priority: 'high'
          });
        } else if (analytics.sessions.completed_sessions / analytics.sessions.total_sessions < 0.7) {
          insights.push({
            type: 'improvement',
            category: 'sessions',
            title: 'Many Incomplete Sessions',
            message: 'Consider setting specific goals for each research session to improve completion rates.',
            priority: 'medium'
          });
        }

        // Session length insights
        const avgDurationHours = analytics.sessions.avg_session_duration_ms / (1000 * 60 * 60);
        if (avgDurationHours < 0.5) {
          insights.push({
            type: 'suggestion',
            category: 'sessions',
            title: 'Short Session Duration',
            message: 'Consider longer, more focused research sessions for deeper work.',
            priority: 'low'
          });
        } else if (avgDurationHours > 3) {
          insights.push({
            type: 'suggestion',
            category: 'sessions',
            title: 'Long Session Duration',
            message: 'Consider breaking long sessions into smaller chunks with breaks.',
            priority: 'medium'
          });
        }
      }

      // Productivity insights
      if (analytics.productivity) {
        if (analytics.productivity.avg_productivity < 50) {
          insights.push({
            type: 'warning',
            category: 'productivity',
            title: 'Low Productivity Score',
            message: 'Focus and productivity levels are below average. Consider eliminating distractions.',
            priority: 'high'
          });
        } else if (analytics.productivity.avg_productivity > 80) {
          insights.push({
            type: 'success',
            category: 'productivity',
            title: 'High Productivity',
            message: 'Excellent focus and productivity levels! Keep up the great work.',
            priority: 'low'
          });
        }

        // Peak performance insights
        if (analytics.productivity.peak_performance_hours.length > 0) {
          const peakHours = analytics.productivity.peak_performance_hours.join(', ');
          insights.push({
            type: 'optimization',
            category: 'productivity',
            title: 'Peak Performance Hours',
            message: `You're most productive during ${peakHours}. Schedule important work during these times.`,
            priority: 'medium'
          });
        }
      }

      return insights;
    } catch (error) {
      console.error('[Analytics Service] Failed to generate insights:', error);
      return [];
    }
  }

  /**
   * Get productivity trends over time
   * @param {string} timeframe - Time period
   * @returns {Promise<Object>} Trend data
   */
  async getProductivityTrends(timeframe) {
    try {
      const timeBounds = this.getTimeBounds(timeframe);
      const analyses = await researchRepository.getAnalysisInRange(
        timeBounds.start,
        timeBounds.end
      );

      if (analyses.length < 2) {
        return {
          trend: 'insufficient_data',
          change_percentage: 0,
          trend_data: []
        };
      }

      // Group by time periods (daily for week/month, weekly for longer)
      const grouping = timeframe.includes('d') ? 'daily' : 'weekly';
      const trendData = this.groupAnalysisForTrends(analyses, grouping);

      // Calculate trend direction
      const trend = this.calculateTrendDirection(trendData);
      const changePercentage = this.calculateChangePercentage(trendData);

      return {
        trend,
        change_percentage: changePercentage,
        trend_data: trendData,
        peak_period: this.findPeakPeriod(trendData),
        lowest_period: this.findLowestPeriod(trendData)
      };
    } catch (error) {
      console.error('[Analytics Service] Failed to get productivity trends:', error);
      return null;
    }
  }

  /**
   * Generate session summary with AI insights
   * @param {string} sessionId - Session ID
   * @param {Array} analysisData - Analysis data for session
   * @returns {Promise<Object>} Session summary
   */
  async generateSessionSummary(sessionId, analysisData) {
    try {
      if (!analysisData || analysisData.length === 0) {
        return {
          summary: 'No analysis data available for this session',
          productivity_score: 0,
          focus_quality: 'unknown',
          key_activities: [],
          recommendations: []
        };
      }

      // Calculate session metrics
      const productivityScores = analysisData.map(a => a.productivity_score || 0);
      const avgProductivity = productivityScores.reduce((sum, score) => sum + score, 0) / productivityScores.length;
      
      const focusQualities = analysisData.map(a => a.focus_quality).filter(Boolean);
      const dominantFocusQuality = this.findMostFrequent(focusQualities) || 'unknown';
      
      const activities = analysisData.map(a => a.activity_type).filter(Boolean);
      const keyActivities = this.getTopActivities(activities, 3);

      // Generate recommendations
      const recommendations = this.generateSessionRecommendations(analysisData, avgProductivity);

      return {
        session_id: sessionId,
        analysis_points: analysisData.length,
        productivity_score: Math.round(avgProductivity * 100) / 100,
        focus_quality: dominantFocusQuality,
        key_activities: keyActivities,
        recommendations,
        productivity_trend: this.calculateProductivityTrendForSession(analysisData),
        distraction_count: this.countDistractions(analysisData),
        focus_periods: this.identifyFocusPeriods(analysisData)
      };
    } catch (error) {
      console.error('[Analytics Service] Failed to generate session summary:', error);
      return null;
    }
  }

  /**
   * Get analytics for specific session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Session analytics
   */
  async getSessionAnalytics(sessionId) {
    try {
      const [session, analyses] = await Promise.all([
        researchRepository.getSessionById(sessionId),
        researchRepository.getSessionAnalysis(sessionId)
      ]);

      if (!session) {
        return null;
      }

      const summary = await this.generateSessionSummary(sessionId, analyses);
      
      return {
        session,
        analyses,
        summary,
        timeline: this.createSessionTimeline(analyses),
        productivity_chart: this.createProductivityChart(analyses)
      };
    } catch (error) {
      console.error('[Analytics Service] Failed to get session analytics:', error);
      return null;
    }
  }

  // ========== HELPER METHODS ==========

  getTimeBounds(timeframe) {
    const now = new Date();
    const end = now.toISOString();
    let start;

    switch (timeframe) {
      case '1h':
        start = new Date(now.getTime() - (60 * 60 * 1000)).toISOString();
        break;
      case '24h':
        start = new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString();
        break;
      case '7d':
        start = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString();
        break;
      case '30d':
        start = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString();
        break;
      default:
        start = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString();
    }

    return { start, end };
  }

  groupSessionsByDay(sessions) {
    const grouped = {};
    
    sessions.forEach(session => {
      const date = new Date(session.start_time).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(session);
    });

    return grouped;
  }

  calculateDailyTrends(sessionsByDay) {
    const trends = {};
    
    Object.entries(sessionsByDay).forEach(([date, sessions]) => {
      const totalDuration = sessions
        .filter(s => s.duration_ms)
        .reduce((sum, s) => sum + s.duration_ms, 0);
      
      trends[date] = {
        session_count: sessions.length,
        total_duration_ms: totalDuration,
        avg_duration_ms: sessions.length > 0 ? totalDuration / sessions.length : 0
      };
    });

    return trends;
  }

  findMostProductiveDay(sessionsByDay) {
    let mostProductiveDay = null;
    let maxDuration = 0;

    Object.entries(sessionsByDay).forEach(([date, sessions]) => {
      const totalDuration = sessions
        .filter(s => s.duration_ms)
        .reduce((sum, s) => sum + s.duration_ms, 0);
      
      if (totalDuration > maxDuration) {
        maxDuration = totalDuration;
        mostProductiveDay = date;
      }
    });

    return mostProductiveDay;
  }

  analyzeSessionPatterns(sessions) {
    const patterns = {
      preferred_start_times: {},
      session_lengths: { short: 0, medium: 0, long: 0 },
      completion_rate: 0
    };

    sessions.forEach(session => {
      // Analyze start times
      const hour = new Date(session.start_time).getHours();
      const timeSlot = this.getTimeSlot(hour);
      patterns.preferred_start_times[timeSlot] = (patterns.preferred_start_times[timeSlot] || 0) + 1;

      // Analyze session lengths
      if (session.duration_ms) {
        const durationHours = session.duration_ms / (1000 * 60 * 60);
        if (durationHours < 1) {
          patterns.session_lengths.short++;
        } else if (durationHours < 3) {
          patterns.session_lengths.medium++;
        } else {
          patterns.session_lengths.long++;
        }
      }
    });

    const completedSessions = sessions.filter(s => s.end_time).length;
    patterns.completion_rate = sessions.length > 0 ? completedSessions / sessions.length : 0;

    return patterns;
  }

  getTimeSlot(hour) {
    if (hour < 6) return 'early_morning';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  calculateDistribution(data, field) {
    const distribution = {};
    
    data.forEach(item => {
      const value = item[field] || 'unknown';
      distribution[value] = (distribution[value] || 0) + 1;
    });

    // Convert to percentages
    const total = data.length;
    Object.keys(distribution).forEach(key => {
      distribution[key] = Math.round((distribution[key] / total) * 100);
    });

    return distribution;
  }

  calculateHourlyProductivity(analyses) {
    const hourlyData = {};
    
    analyses.forEach(analysis => {
      const hour = new Date(analysis.timestamp).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { scores: [], count: 0 };
      }
      hourlyData[hour].scores.push(analysis.productivity_score || 0);
      hourlyData[hour].count++;
    });

    // Calculate averages
    Object.keys(hourlyData).forEach(hour => {
      const data = hourlyData[hour];
      hourlyData[hour] = {
        avg_productivity: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length,
        sample_count: data.count
      };
    });

    return hourlyData;
  }

  findPeakPerformanceHours(hourlyProductivity) {
    const hours = Object.entries(hourlyProductivity)
      .filter(([hour, data]) => data.sample_count >= 3) // Minimum sample size
      .sort(([,a], [,b]) => b.avg_productivity - a.avg_productivity)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    return hours.map(hour => `${hour}:00-${hour + 1}:00`);
  }

  calculateProductivityTrend(analyses) {
    if (analyses.length < 3) return 'insufficient_data';

    const midpoint = Math.floor(analyses.length / 2);
    const firstHalf = analyses.slice(0, midpoint);
    const secondHalf = analyses.slice(midpoint);

    const firstHalfAvg = firstHalf.reduce((sum, a) => sum + (a.productivity_score || 0), 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, a) => sum + (a.productivity_score || 0), 0) / secondHalf.length;

    const difference = secondHalfAvg - firstHalfAvg;
    
    if (Math.abs(difference) < 5) return 'stable';
    return difference > 0 ? 'improving' : 'declining';
  }

  findMostFrequent(array) {
    const frequency = {};
    let maxCount = 0;
    let mostFrequent = null;

    array.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
      if (frequency[item] > maxCount) {
        maxCount = frequency[item];
        mostFrequent = item;
      }
    });

    return mostFrequent;
  }

  getTopActivities(activities, count) {
    const frequency = {};
    activities.forEach(activity => {
      frequency[activity] = (frequency[activity] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([activity, freq]) => ({ activity, frequency: freq }));
  }

  generateSessionRecommendations(analysisData, avgProductivity) {
    const recommendations = [];

    if (avgProductivity < 50) {
      recommendations.push({
        type: 'focus',
        message: 'Consider minimizing distractions and using focus techniques like the Pomodoro method.'
      });
    }

    const distractionCount = this.countDistractions(analysisData);
    if (distractionCount > analysisData.length * 0.3) {
      recommendations.push({
        type: 'distraction',
        message: 'High distraction levels detected. Try working in a quieter environment.'
      });
    }

    if (analysisData.length < 3) {
      recommendations.push({
        type: 'duration',
        message: 'Consider longer research sessions for more comprehensive analysis and insights.'
      });
    }

    return recommendations;
  }

  countDistractions(analysisData) {
    return analysisData.filter(a => 
      (a.productivity_score || 0) < 30 || 
      (a.focus_quality && ['poor', 'distracted'].includes(a.focus_quality))
    ).length;
  }

  cleanupCache() {
    // Clean cache entries older than 1 hour
    const cutoff = Date.now() - (60 * 60 * 1000);
    
    for (const [key, value] of this.aggregationCache) {
      if (value.timestamp < cutoff) {
        this.aggregationCache.delete(key);
      }
    }
  }
}

module.exports = AnalyticsService;