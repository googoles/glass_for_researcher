/**
 * AI-Powered Insight Generation System
 * Generates personalized insights and recommendations based on activity patterns
 */

class InsightGenerator {
  constructor() {
    this.insightTypes = {
      PRODUCTIVITY_TREND: 'productivity_trend',
      FOCUS_PATTERN: 'focus_pattern',
      APPLICATION_USAGE: 'application_usage',
      TIME_OPTIMIZATION: 'time_optimization',
      DISTRACTION_ANALYSIS: 'distraction_analysis',
      WORKFLOW_EFFICIENCY: 'workflow_efficiency',
      BEHAVIORAL_CHANGE: 'behavioral_change',
      GOAL_ALIGNMENT: 'goal_alignment'
    };

    this.recommendationStrategies = {
      immediate: { priority: 'high', timeframe: 'today' },
      shortTerm: { priority: 'medium', timeframe: 'this_week' },
      longTerm: { priority: 'low', timeframe: 'this_month' }
    };
  }

  /**
   * Generate comprehensive insights from analysis history
   * @param {Array} analysisHistory - Historical analysis data
   * @param {Object} userPreferences - User goals and preferences
   * @returns {Object} Generated insights and recommendations
   */
  async generate(analysisHistory, userPreferences = {}) {
    if (analysisHistory.length < 5) {
      return this.generateMinimalInsights(analysisHistory);
    }

    try {
      const insights = {
        overview: this.generateOverviewInsights(analysisHistory),
        productivity: await this.generateProductivityInsights(analysisHistory),
        focus: await this.generateFocusInsights(analysisHistory),
        applications: await this.generateApplicationInsights(analysisHistory),
        temporal: await this.generateTemporalInsights(analysisHistory),
        behavioral: await this.generateBehavioralInsights(analysisHistory),
        recommendations: await this.generateRecommendations(analysisHistory, userPreferences),
        goalProgress: this.assessGoalProgress(analysisHistory, userPreferences),
        predictions: this.generatePredictions(analysisHistory)
      };

      return {
        ...insights,
        metadata: {
          generatedAt: Date.now(),
          dataPoints: analysisHistory.length,
          confidenceScore: this.calculateInsightConfidence(analysisHistory),
          version: '2.0'
        }
      };
    } catch (error) {
      console.error('[InsightGenerator] Failed to generate insights:', error);
      return this.generateErrorFallback(analysisHistory);
    }
  }

  /**
   * Generate overview insights summarizing overall patterns
   */
  generateOverviewInsights(history) {
    const avgProductivity = this.calculateAverageProductivity(history);
    const productivityTrend = this.calculateProductivityTrend(history);
    const totalWorkTime = this.calculateTotalWorkTime(history);
    const focusQuality = this.calculateOverallFocusQuality(history);

    return {
      productivity: {
        average: Math.round(avgProductivity * 10) / 10,
        trend: productivityTrend,
        rating: this.rateProductivity(avgProductivity)
      },
      workTime: {
        total: totalWorkTime,
        dailyAverage: totalWorkTime / this.getUniqueDays(history),
        efficiency: this.calculateWorkEfficiency(history)
      },
      focus: {
        quality: focusQuality,
        consistency: this.calculateFocusConsistency(history),
        improvements: this.identifyFocusImprovements(history)
      },
      keyMetrics: this.extractKeyMetrics(history)
    };
  }

  /**
   * Generate detailed productivity insights
   */
  async generateProductivityInsights(history) {
    const productivityData = history.map(h => ({
      timestamp: h.timestamp,
      score: h.productivity_score || h.combinedScore || 0,
      application: h.applications?.[0] || 'unknown'
    }));

    const insights = {
      trends: this.analyzeProductivityTrends(productivityData),
      patterns: this.identifyProductivityPatterns(productivityData),
      peaks: this.identifyProductivityPeaks(productivityData),
      dips: this.identifyProductivityDips(productivityData),
      factors: this.identifyProductivityFactors(history),
      opportunities: this.identifyImprovementOpportunities(productivityData)
    };

    return insights;
  }

  /**
   * Generate focus-related insights
   */
  async generateFocusInsights(history) {
    const focusData = history.filter(h => h.focus_quality || h.tags?.includes('focused'));
    
    return {
      sessionAnalysis: this.analyzeFocusSessions(focusData),
      distractionPatterns: this.analyzeDistractionPatterns(history),
      flowStates: this.identifyFlowStates(history),
      interruptionImpact: this.assessInterruptionImpact(history),
      focusStrategies: this.recommendFocusStrategies(focusData),
      optimalConditions: this.identifyOptimalFocusConditions(focusData)
    };
  }

  /**
   * Generate application usage insights
   */
  async generateApplicationInsights(history) {
    const appData = this.extractApplicationData(history);
    
    return {
      usageDistribution: this.analyzeUsageDistribution(appData),
      productivityByApp: this.analyzeAppProductivity(appData),
      switchingPatterns: this.analyzeSwitchingPatterns(appData),
      appRecommendations: this.generateAppRecommendations(appData),
      workflowOptimization: this.identifyWorkflowOptimizations(appData),
      toolEfficiency: this.assessToolEfficiency(appData)
    };
  }

  /**
   * Generate temporal (time-based) insights
   */
  async generateTemporalInsights(history) {
    const temporalData = this.extractTemporalData(history);
    
    return {
      circadianRhythm: this.analyzeCircadianRhythm(temporalData),
      peakHours: this.identifyPeakHours(temporalData),
      energyPatterns: this.analyzeEnergyPatterns(temporalData),
      schedulingOptimization: this.optimizeScheduling(temporalData),
      breakPatterns: this.analyzeBreakPatterns(temporalData),
      seasonalTrends: this.identifySeasonalTrends(temporalData)
    };
  }

  /**
   * Generate behavioral insights
   */
  async generateBehavioralInsights(history) {
    return {
      workingStyles: this.identifyWorkingStyles(history),
      habitPatterns: this.analyzeHabitPatterns(history),
      adaptationCapacity: this.assessAdaptationCapacity(history),
      stressIndicators: this.identifyStressIndicators(history),
      motivationPatterns: this.analyzeMotivationPatterns(history),
      learningTrends: this.identifyLearningTrends(history)
    };
  }

  /**
   * Generate actionable recommendations
   */
  async generateRecommendations(history, preferences) {
    const immediate = [];
    const shortTerm = [];
    const longTerm = [];

    // Analyze current state for immediate recommendations
    const recentData = history.slice(-10);
    const currentIssues = this.identifyCurrentIssues(recentData);
    
    currentIssues.forEach(issue => {
      immediate.push(this.createImmediateRecommendation(issue));
    });

    // Analyze patterns for short-term recommendations
    const patterns = this.identifyActionablePatterns(history);
    patterns.forEach(pattern => {
      shortTerm.push(this.createShortTermRecommendation(pattern));
    });

    // Analyze long-term trends for strategic recommendations
    const trends = this.identifyLongTermTrends(history);
    trends.forEach(trend => {
      longTerm.push(this.createLongTermRecommendation(trend, preferences));
    });

    return {
      immediate: immediate.slice(0, 3), // Top 3 immediate actions
      shortTerm: shortTerm.slice(0, 5), // Top 5 weekly goals
      longTerm: longTerm.slice(0, 3),   // Top 3 strategic changes
      personalized: this.generatePersonalizedRecommendations(history, preferences)
    };
  }

  /**
   * Assess progress toward user goals
   */
  assessGoalProgress(history, preferences) {
    if (!preferences.goals || preferences.goals.length === 0) {
      return { message: 'No goals set. Consider setting productivity goals for better insights.' };
    }

    const progress = {};
    
    preferences.goals.forEach(goal => {
      switch (goal.type) {
        case 'productivity_target':
          progress[goal.id] = this.assessProductivityGoal(history, goal);
          break;
        case 'focus_improvement':
          progress[goal.id] = this.assessFocusGoal(history, goal);
          break;
        case 'time_management':
          progress[goal.id] = this.assessTimeGoal(history, goal);
          break;
        case 'habit_formation':
          progress[goal.id] = this.assessHabitGoal(history, goal);
          break;
        default:
          progress[goal.id] = this.assessGenericGoal(history, goal);
      }
    });

    return progress;
  }

  /**
   * Generate predictions based on current trends
   */
  generatePredictions(history) {
    return {
      productivityForecast: this.forecastProductivity(history),
      riskAssessment: this.assessProductivityRisks(history),
      opportunityIdentification: this.identifyUpcomingOpportunities(history),
      behavioralProjections: this.projectBehavioralChanges(history)
    };
  }

  // Helper methods for insight generation

  calculateAverageProductivity(history) {
    const scores = history.map(h => h.productivity_score || h.combinedScore || 0);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  calculateProductivityTrend(history) {
    if (history.length < 10) return 'insufficient_data';
    
    const firstHalf = history.slice(0, Math.floor(history.length / 2));
    const secondHalf = history.slice(Math.floor(history.length / 2));
    
    const firstAvg = this.calculateAverageProductivity(firstHalf);
    const secondAvg = this.calculateAverageProductivity(secondHalf);
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 10) return 'strongly_improving';
    if (change > 5) return 'improving';
    if (change > -5) return 'stable';
    if (change > -10) return 'declining';
    return 'strongly_declining';
  }

  calculateTotalWorkTime(history) {
    // Estimate total work time based on productive activities
    return history
      .filter(h => (h.productivity_score || 0) > 4)
      .length * 3; // Assuming 3 minutes per screenshot on average
  }

  calculateOverallFocusQuality(history) {
    const focusScores = history.map(h => {
      if (h.tags?.includes('deep-work')) return 10;
      if (h.tags?.includes('focused')) return 8;
      if (h.tags?.includes('distracted')) return 3;
      return (h.productivity_score || 0) > 6 ? 7 : 4;
    });
    
    return focusScores.reduce((sum, score) => sum + score, 0) / focusScores.length;
  }

  getUniqueDays(history) {
    const days = new Set();
    history.forEach(h => {
      const date = new Date(h.timestamp || Date.now()).toDateString();
      days.add(date);
    });
    return Math.max(1, days.size);
  }

  calculateWorkEfficiency(history) {
    const totalTime = history.length;
    const productiveTime = history.filter(h => (h.productivity_score || 0) > 5).length;
    return totalTime > 0 ? (productiveTime / totalTime) * 100 : 0;
  }

  calculateFocusConsistency(history) {
    const productivityScores = history.map(h => h.productivity_score || 0);
    const mean = productivityScores.reduce((sum, score) => sum + score, 0) / productivityScores.length;
    const variance = productivityScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / productivityScores.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to consistency score (lower standard deviation = higher consistency)
    return Math.max(0, 100 - (stdDev * 10));
  }

  identifyFocusImprovements(history) {
    const improvements = [];
    
    const recentFocus = this.calculateOverallFocusQuality(history.slice(-5));
    const earlierFocus = this.calculateOverallFocusQuality(history.slice(0, 5));
    
    if (recentFocus > earlierFocus + 1) {
      improvements.push('Focus quality has improved recently');
    }
    
    if (history.some(h => h.tags?.includes('deep-work'))) {
      improvements.push('Deep work sessions detected');
    }
    
    return improvements;
  }

  extractKeyMetrics(history) {
    return {
      totalSessions: history.length,
      averageSessionLength: 3, // minutes, estimated
      topApplication: this.getTopApplication(history),
      bestProductivityHour: this.getBestProductivityHour(history),
      focusStreakRecord: this.calculateMaxFocusStreak(history),
      improvementRate: this.calculateImprovementRate(history)
    };
  }

  analyzeProductivityTrends(productivityData) {
    const trends = {
      daily: this.analyzeDailyTrends(productivityData),
      weekly: this.analyzeWeeklyTrends(productivityData),
      hourly: this.analyzeHourlyTrends(productivityData)
    };

    return {
      ...trends,
      overall: this.determineOverallTrend(trends),
      volatility: this.calculateProductivityVolatility(productivityData),
      stability: this.assessProductivityStability(productivityData)
    };
  }

  identifyProductivityPatterns(productivityData) {
    return {
      recurringPeaks: this.findRecurringPeaks(productivityData),
      commonDips: this.findCommonDips(productivityData),
      cyclicalBehavior: this.detectCyclicalBehavior(productivityData),
      correlationFactors: this.identifyCorrelationFactors(productivityData)
    };
  }

  identifyProductivityPeaks(productivityData) {
    const threshold = this.calculateProductivityThreshold(productivityData, 0.8); // Top 20%
    return productivityData
      .filter(d => d.score >= threshold)
      .map(peak => ({
        timestamp: peak.timestamp,
        score: peak.score,
        application: peak.application,
        context: this.inferPeakContext(peak)
      }));
  }

  identifyProductivityDips(productivityData) {
    const threshold = this.calculateProductivityThreshold(productivityData, 0.2); // Bottom 20%
    return productivityData
      .filter(d => d.score <= threshold)
      .map(dip => ({
        timestamp: dip.timestamp,
        score: dip.score,
        application: dip.application,
        possibleCauses: this.inferDipCauses(dip)
      }));
  }

  identifyProductivityFactors(history) {
    const factors = {
      positive: [],
      negative: [],
      neutral: []
    };

    // Application factors
    const appProductivity = this.analyzeAppProductivity(this.extractApplicationData(history));
    Object.entries(appProductivity).forEach(([app, data]) => {
      if (data.averageProductivity > 7) {
        factors.positive.push({ type: 'application', name: app, impact: 'high' });
      } else if (data.averageProductivity < 4) {
        factors.negative.push({ type: 'application', name: app, impact: 'high' });
      }
    });

    // Time factors
    const hourlyData = this.analyzeHourlyTrends(history);
    if (hourlyData.peakHour) {
      factors.positive.push({ type: 'timing', name: `${hourlyData.peakHour}:00`, impact: 'medium' });
    }

    // Behavioral factors
    if (history.some(h => h.tags?.includes('deep-work'))) {
      factors.positive.push({ type: 'behavior', name: 'deep work sessions', impact: 'high' });
    }
    
    if (history.some(h => h.tags?.includes('distracted'))) {
      factors.negative.push({ type: 'behavior', name: 'frequent distractions', impact: 'medium' });
    }

    return factors;
  }

  identifyImprovementOpportunities(productivityData) {
    const opportunities = [];

    // Low productivity time slots
    const hourlyAvg = this.calculateHourlyAverages(productivityData);
    Object.entries(hourlyAvg).forEach(([hour, avg]) => {
      if (avg < 4) {
        opportunities.push({
          type: 'time_optimization',
          description: `Low productivity at ${hour}:00 - consider different activities`,
          potential_impact: 'medium',
          effort_required: 'low'
        });
      }
    });

    // Application switching opportunities
    const switchingData = this.analyzeSwitchingPatterns(productivityData);
    if (switchingData.frequency > 0.3) {
      opportunities.push({
        type: 'focus_improvement',
        description: 'High application switching detected - consider focus techniques',
        potential_impact: 'high',
        effort_required: 'medium'
      });
    }

    return opportunities;
  }

  analyzeFocusSessions(focusData) {
    return {
      averageLength: this.calculateAverageFocusLength(focusData),
      qualityDistribution: this.analyzeFocusQuality(focusData),
      optimalConditions: this.identifyOptimalFocusConditions(focusData),
      improvementTrend: this.calculateFocusImprovement(focusData)
    };
  }

  analyzeDistractionPatterns(history) {
    const distractions = history.filter(h => h.tags?.includes('distracted') || (h.productivity_score || 0) < 3);
    
    return {
      frequency: distractions.length / history.length,
      commonTriggers: this.identifyDistractionTriggers(distractions),
      timePatterns: this.analyzeDistractionTiming(distractions),
      recoveryTime: this.calculateDistractionRecovery(history, distractions),
      mitigation: this.suggestDistractionMitigation(distractions)
    };
  }

  identifyFlowStates(history) {
    const flowSessions = history.filter(h => 
      (h.productivity_score || 0) > 8 && 
      h.tags?.includes('deep-work')
    );

    return {
      frequency: flowSessions.length / history.length,
      averageDuration: this.estimateFlowDuration(flowSessions),
      triggers: this.identifyFlowTriggers(flowSessions),
      conditions: this.analyzeFlowConditions(flowSessions)
    };
  }

  assessInterruptionImpact(history) {
    // Detect interruptions as sudden drops in productivity
    const interruptions = [];
    
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1].productivity_score || 0;
      const curr = history[i].productivity_score || 0;
      
      if (prev > 6 && curr < 4) {
        interruptions.push({
          timestamp: history[i].timestamp,
          productivityDrop: prev - curr,
          recoveryTime: this.calculateRecoveryTime(history, i)
        });
      }
    }

    return {
      frequency: interruptions.length / history.length,
      averageImpact: interruptions.reduce((sum, i) => sum + i.productivityDrop, 0) / interruptions.length,
      averageRecovery: interruptions.reduce((sum, i) => sum + i.recoveryTime, 0) / interruptions.length,
      costEstimate: this.estimateInterruptionCost(interruptions)
    };
  }

  recommendFocusStrategies(focusData) {
    const strategies = [];

    if (focusData.length < 3) {
      strategies.push({
        strategy: 'pomodoro_technique',
        description: 'Try 25-minute focused work sessions with 5-minute breaks',
        confidence: 0.8
      });
    }

    const avgFocusLength = this.calculateAverageFocusLength(focusData);
    if (avgFocusLength < 15) {
      strategies.push({
        strategy: 'gradual_extension',
        description: 'Gradually increase focus session length by 5 minutes weekly',
        confidence: 0.7
      });
    }

    if (this.hasDistractionIssues(focusData)) {
      strategies.push({
        strategy: 'environment_optimization',
        description: 'Optimize work environment to minimize distractions',
        confidence: 0.9
      });
    }

    return strategies;
  }

  identifyOptimalFocusConditions(focusData) {
    if (focusData.length < 5) return { insufficient_data: true };

    const conditions = {
      optimalTime: this.findOptimalFocusTime(focusData),
      preferredApps: this.findFocusApplications(focusData),
      sessionLength: this.findOptimalSessionLength(focusData),
      environmentFactors: this.analyzeEnvironmentFactors(focusData)
    };

    return conditions;
  }

  // Additional helper methods would continue here...
  // For brevity, I'll include a few key ones:

  createImmediateRecommendation(issue) {
    const recommendationMap = {
      low_productivity: {
        action: 'Take a 5-minute break and return to a high-productivity application',
        reason: 'Current productivity is below your average',
        impact: 'high',
        effort: 'low'
      },
      excessive_switching: {
        action: 'Focus on one application for the next 25 minutes',
        reason: 'Frequent app switching is reducing productivity',
        impact: 'medium',
        effort: 'low'
      },
      distraction_pattern: {
        action: 'Close distracting applications and websites',
        reason: 'Distraction sources detected',
        impact: 'high',
        effort: 'low'
      }
    };

    return recommendationMap[issue.type] || {
      action: 'Review current activity and refocus on priority tasks',
      reason: 'General productivity optimization needed',
      impact: 'medium',
      effort: 'low'
    };
  }

  generatePersonalizedRecommendations(history, preferences) {
    const personalized = [];

    // Based on user goals
    if (preferences.goals?.includes('increase_focus')) {
      personalized.push({
        category: 'focus',
        recommendation: 'Schedule deep work blocks during your peak hours',
        basedOn: 'your focus improvement goal'
      });
    }

    // Based on detected patterns
    const peakHour = this.getBestProductivityHour(history);
    if (peakHour) {
      personalized.push({
        category: 'scheduling',
        recommendation: `Schedule your most important work around ${peakHour}:00`,
        basedOn: 'your productivity peaks'
      });
    }

    return personalized;
  }

  calculateInsightConfidence(history) {
    let confidence = 0;
    
    // Data volume confidence
    if (history.length > 100) confidence += 30;
    else if (history.length > 50) confidence += 20;
    else if (history.length > 20) confidence += 10;
    
    // Data quality confidence
    const hasProductivityScores = history.filter(h => h.productivity_score).length / history.length;
    confidence += hasProductivityScores * 30;
    
    // Time span confidence
    const timeSpan = this.getTimeSpan(history);
    const days = timeSpan / (24 * 60 * 60 * 1000);
    if (days > 7) confidence += 20;
    else if (days > 3) confidence += 10;
    else if (days > 1) confidence += 5;
    
    // Pattern consistency confidence
    if (this.hasConsistentPatterns(history)) confidence += 20;
    
    return Math.min(100, confidence);
  }

  generateMinimalInsights(history) {
    return {
      message: 'Collecting data for meaningful insights. Continue using the system for better analysis.',
      basicStats: {
        sessions: history.length,
        averageProductivity: this.calculateAverageProductivity(history),
        topApplication: this.getTopApplication(history)
      },
      recommendations: {
        immediate: [
          {
            action: 'Continue using the system regularly',
            reason: 'More data will enable better insights',
            impact: 'high',
            effort: 'low'
          }
        ]
      }
    };
  }

  generateErrorFallback(history) {
    return {
      error: 'Failed to generate comprehensive insights',
      basicInsights: this.generateMinimalInsights(history),
      message: 'Basic insights provided. Please try again later for detailed analysis.'
    };
  }

  // Utility methods

  getTopApplication(history) {
    const appCounts = {};
    history.forEach(h => {
      const app = h.applications?.[0] || 'unknown';
      appCounts[app] = (appCounts[app] || 0) + 1;
    });
    
    return Object.entries(appCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';
  }

  getBestProductivityHour(history) {
    const hourlyScores = {};
    history.forEach(h => {
      if (h.timestamp && h.productivity_score) {
        const hour = new Date(h.timestamp).getHours();
        if (!hourlyScores[hour]) hourlyScores[hour] = [];
        hourlyScores[hour].push(h.productivity_score);
      }
    });

    let bestHour = null;
    let bestAvg = 0;
    
    Object.entries(hourlyScores).forEach(([hour, scores]) => {
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestHour = parseInt(hour);
      }
    });

    return bestHour;
  }

  calculateMaxFocusStreak(history) {
    let maxStreak = 0;
    let currentStreak = 0;
    
    history.forEach(h => {
      if ((h.productivity_score || 0) > 6) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    return maxStreak;
  }

  calculateImprovementRate(history) {
    if (history.length < 10) return 0;
    
    const firstQuarter = history.slice(0, Math.floor(history.length / 4));
    const lastQuarter = history.slice(-Math.floor(history.length / 4));
    
    const firstAvg = this.calculateAverageProductivity(firstQuarter);
    const lastAvg = this.calculateAverageProductivity(lastQuarter);
    
    return ((lastAvg - firstAvg) / firstAvg) * 100;
  }

  getTimeSpan(history) {
    if (history.length < 2) return 0;
    const timestamps = history.map(h => h.timestamp || Date.now()).sort((a, b) => a - b);
    return timestamps[timestamps.length - 1] - timestamps[0];
  }

  hasConsistentPatterns(history) {
    // Simple heuristic for pattern consistency
    const apps = history.map(h => h.applications?.[0] || 'unknown');
    const uniqueApps = new Set(apps);
    
    // If using a reasonable variety of apps consistently
    return uniqueApps.size > 2 && uniqueApps.size < history.length / 2;
  }

  extractApplicationData(history) {
    const appData = new Map();
    
    history.forEach(h => {
      const app = h.applications?.[0] || 'unknown';
      if (!appData.has(app)) {
        appData.set(app, {
          count: 0,
          totalProductivity: 0,
          timestamps: []
        });
      }
      
      const data = appData.get(app);
      data.count++;
      data.totalProductivity += h.productivity_score || 0;
      data.timestamps.push(h.timestamp || Date.now());
    });
    
    return appData;
  }

  extractTemporalData(history) {
    return history.map(h => ({
      timestamp: h.timestamp || Date.now(),
      hour: new Date(h.timestamp || Date.now()).getHours(),
      dayOfWeek: new Date(h.timestamp || Date.now()).getDay(),
      productivity: h.productivity_score || 0
    }));
  }

  rateProductivity(avgProductivity) {
    if (avgProductivity >= 8) return 'excellent';
    if (avgProductivity >= 6) return 'good';
    if (avgProductivity >= 4) return 'fair';
    return 'needs_improvement';
  }
}

module.exports = InsightGenerator;