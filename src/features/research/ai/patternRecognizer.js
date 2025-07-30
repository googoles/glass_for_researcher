/**
 * Pattern Recognition System for Activity Analysis
 * Performs computational analysis of screenshot sequences to identify behavioral patterns
 */

class PatternRecognizer {
  constructor() {
    this.patterns = {
      focusSessions: [],
      taskSwitching: [],
      productivityCycles: [],
      applicationUsage: new Map(),
      temporalPatterns: new Map()
    };
  }

  /**
   * Analyze a sequence of screenshots for patterns
   * @param {Array} screenshots - Array of screenshot analysis results
   * @returns {Object} Identified patterns
   */
  async analyzeSequence(screenshots) {
    if (screenshots.length < 3) {
      return { error: 'Insufficient data for pattern analysis', required: 3, provided: screenshots.length };
    }

    try {
      const patterns = {
        focusPatterns: await this.identifyFocusPatterns(screenshots),
        taskSwitchingPatterns: await this.analyzeTaskSwitching(screenshots),
        productivityRhythms: await this.identifyProductivityRhythms(screenshots),
        applicationPatterns: await this.analyzeApplicationUsage(screenshots),
        temporalPatterns: await this.identifyTemporalPatterns(screenshots),
        distractionPatterns: await this.identifyDistractionPatterns(screenshots),
        workflowPatterns: await this.identifyWorkflowPatterns(screenshots)
      };

      return {
        ...patterns,
        metadata: {
          analyzeTime: Date.now(),
          screenshotCount: screenshots.length,
          timeSpan: this.calculateTimeSpan(screenshots),
          confidence: this.calculatePatternConfidence(patterns)
        }
      };
    } catch (error) {
      console.error('[PatternRecognizer] Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Identify focus session patterns
   */
  async identifyFocusPatterns(screenshots) {
    const focusSessions = [];
    let currentSession = null;
    const FOCUS_THRESHOLD = 6; // Productivity score threshold for focus
    const MAX_BREAK_DURATION = 5 * 60 * 1000; // 5 minutes

    for (let i = 0; i < screenshots.length; i++) {
      const screenshot = screenshots[i];
      const productivity = screenshot.productivity_score || 0;
      const timestamp = screenshot.timestamp || Date.now();

      if (productivity >= FOCUS_THRESHOLD) {
        if (!currentSession) {
          // Start new focus session
          currentSession = {
            startTime: timestamp,
            endTime: timestamp,
            peakProductivity: productivity,
            averageProductivity: productivity,
            screenshots: [screenshot],
            interruptions: 0
          };
        } else {
          // Continue focus session
          const timeSinceLastHigh = timestamp - currentSession.endTime;
          if (timeSinceLastHigh <= MAX_BREAK_DURATION) {
            // Extend session
            currentSession.endTime = timestamp;
            currentSession.screenshots.push(screenshot);
            currentSession.peakProductivity = Math.max(currentSession.peakProductivity, productivity);
            
            // Recalculate average
            const total = currentSession.screenshots.reduce((sum, s) => sum + (s.productivity_score || 0), 0);
            currentSession.averageProductivity = total / currentSession.screenshots.length;
          } else {
            // Gap too large, end current session and start new one
            focusSessions.push(this.finalizeFocusSession(currentSession));
            currentSession = {
              startTime: timestamp,
              endTime: timestamp,
              peakProductivity: productivity,
              averageProductivity: productivity,
              screenshots: [screenshot],
              interruptions: 0
            };
          }
        }
      } else if (currentSession) {
        // Low productivity during focus session - count as interruption
        const timeSinceStart = timestamp - currentSession.startTime;
        if (timeSinceStart > 2 * 60 * 1000) { // Only count if session is at least 2 minutes
          currentSession.interruptions++;
        }
      }
    }

    // Finalize last session if exists
    if (currentSession) {
      focusSessions.push(this.finalizeFocusSession(currentSession));
    }

    return {
      sessions: focusSessions,
      totalFocusTime: focusSessions.reduce((sum, s) => sum + s.duration, 0),
      averageSessionLength: focusSessions.length > 0 ? 
        focusSessions.reduce((sum, s) => sum + s.duration, 0) / focusSessions.length : 0,
      focusEfficiency: this.calculateFocusEfficiency(focusSessions),
      bestFocusSession: focusSessions.length > 0 ? 
        focusSessions.reduce((best, current) => 
          current.averageProductivity > best.averageProductivity ? current : best
        ) : null
    };
  }

  /**
   * Analyze task switching patterns
   */
  async analyzeTaskSwitching(screenshots) {
    const switches = [];
    let previousApp = null;
    let switchCount = 0;
    const appDurations = new Map();
    let lastSwitchTime = null;

    for (let i = 0; i < screenshots.length; i++) {
      const screenshot = screenshots[i];
      const currentApp = this.extractPrimaryApplication(screenshot);
      const timestamp = screenshot.timestamp || Date.now();

      if (previousApp && currentApp !== previousApp) {
        // Task switch detected
        const switchDuration = lastSwitchTime ? timestamp - lastSwitchTime : 0;
        
        switches.push({
          fromApp: previousApp,
          toApp: currentApp,
          timestamp: timestamp,
          timeSinceLast: switchDuration,
          productivity: screenshot.productivity_score || 0,
          contextLoss: this.estimateContextLoss(previousApp, currentApp),
          switchType: this.classifySwitchType(previousApp, currentApp)
        });

        switchCount++;
        
        // Track duration for previous app
        if (lastSwitchTime) {
          const duration = timestamp - lastSwitchTime;
          appDurations.set(previousApp, (appDurations.get(previousApp) || 0) + duration);
        }
      }

      previousApp = currentApp;
      lastSwitchTime = timestamp;
    }

    return {
      totalSwitches: switchCount,
      switchFrequency: screenshots.length > 0 ? switchCount / screenshots.length : 0,
      switches: switches,
      averageTimeBetweenSwitches: switches.length > 1 ? 
        switches.slice(1).reduce((sum, s) => sum + s.timeSinceLast, 0) / (switches.length - 1) : 0,
      contextualSwitches: switches.filter(s => s.switchType === 'contextual').length,
      distractingSwitches: switches.filter(s => s.switchType === 'distracting').length,
      mostUsedApps: Array.from(appDurations.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([app, duration]) => ({ app, duration })),
      switchingEfficiency: this.calculateSwitchingEfficiency(switches)
    };
  }

  /**
   * Identify productivity rhythms throughout the analyzed period
   */
  async identifyProductivityRhythms(screenshots) {
    if (screenshots.length < 10) {
      return { error: 'Insufficient data for rhythm analysis' };
    }

    const timeSlots = this.groupByTimeSlots(screenshots, 30 * 60 * 1000); // 30-minute slots
    const rhythms = [];

    // Analyze each time slot
    for (const [timeSlot, screenList] of timeSlots.entries()) {
      const avgProductivity = screenList.reduce((sum, s) => sum + (s.productivity_score || 0), 0) / screenList.length;
      const peakProductivity = Math.max(...screenList.map(s => s.productivity_score || 0));
      const consistency = this.calculateConsistency(screenList.map(s => s.productivity_score || 0));

      rhythms.push({
        timeSlot: new Date(parseInt(timeSlot)).toLocaleTimeString(),
        averageProductivity: avgProductivity,
        peakProductivity: peakProductivity,
        consistency: consistency,
        screenshotCount: screenList.length,
        dominantActivity: this.findDominantActivity(screenList)
      });
    }

    // Identify patterns
    const peakPeriods = rhythms
      .filter(r => r.averageProductivity > 7)
      .sort((a, b) => b.averageProductivity - a.averageProductivity);

    const lowPeriods = rhythms
      .filter(r => r.averageProductivity < 4)
      .sort((a, b) => a.averageProductivity - b.averageProductivity);

    return {
      timeSlotAnalysis: rhythms,
      peakProductivityPeriods: peakPeriods.slice(0, 3),
      lowProductivityPeriods: lowPeriods.slice(0, 3),
      overallTrend: this.calculateProductivityTrend(rhythms),
      consistencyScore: rhythms.reduce((sum, r) => sum + r.consistency, 0) / rhythms.length,
      recommendations: this.generateRhythmRecommendations(rhythms)
    };
  }

  /**
   * Analyze application usage patterns
   */
  async analyzeApplicationUsage(screenshots) {
    const appStats = new Map();
    const appTransitions = new Map();
    let previousApp = null;

    screenshots.forEach(screenshot => {
      const app = this.extractPrimaryApplication(screenshot);
      const productivity = screenshot.productivity_score || 0;
      const timestamp = screenshot.timestamp || Date.now();

      // Update app statistics
      if (!appStats.has(app)) {
        appStats.set(app, {
          count: 0,
          totalProductivity: 0,
          peakProductivity: 0,
          sessions: [],
          firstSeen: timestamp,
          lastSeen: timestamp
        });
      }

      const stats = appStats.get(app);
      stats.count++;
      stats.totalProductivity += productivity;
      stats.peakProductivity = Math.max(stats.peakProductivity, productivity);
      stats.lastSeen = timestamp;

      // Track transitions
      if (previousApp && previousApp !== app) {
        const transitionKey = `${previousApp}->${app}`;
        appTransitions.set(transitionKey, (appTransitions.get(transitionKey) || 0) + 1);
      }

      previousApp = app;
    });

    // Calculate derived metrics
    const appAnalysis = Array.from(appStats.entries()).map(([app, stats]) => ({
      application: app,
      usageCount: stats.count,
      averageProductivity: stats.totalProductivity / stats.count,
      peakProductivity: stats.peakProductivity,
      usagePercentage: (stats.count / screenshots.length) * 100,
      sessionDuration: stats.lastSeen - stats.firstSeen,
      productivityRating: this.rateAppProductivity(stats.totalProductivity / stats.count)
    }));

    return {
      applicationStats: appAnalysis.sort((a, b) => b.usageCount - a.usageCount),
      mostProductiveApps: appAnalysis
        .filter(a => a.usageCount >= 3)
        .sort((a, b) => b.averageProductivity - a.averageProductivity)
        .slice(0, 5),
      frequentTransitions: Array.from(appTransitions.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([transition, count]) => ({ transition, count })),
      applicationEfficiency: this.calculateApplicationEfficiency(appAnalysis),
      recommendations: this.generateAppRecommendations(appAnalysis)
    };
  }

  /**
   * Identify temporal patterns (time-of-day, day-of-week effects)
   */
  async identifyTemporalPatterns(screenshots) {
    const hourlyData = new Map();
    const dayOfWeekData = new Map();

    screenshots.forEach(screenshot => {
      const date = new Date(screenshot.timestamp || Date.now());
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const productivity = screenshot.productivity_score || 0;

      // Hourly patterns
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, { productivitySum: 0, count: 0, scores: [] });
      }
      const hourStats = hourlyData.get(hour);
      hourStats.productivitySum += productivity;
      hourStats.count++;
      hourStats.scores.push(productivity);

      // Day of week patterns (if data spans multiple days)
      if (!dayOfWeekData.has(dayOfWeek)) {
        dayOfWeekData.set(dayOfWeek, { productivitySum: 0, count: 0, scores: [] });
      }
      const dayStats = dayOfWeekData.get(dayOfWeek);
      dayStats.productivitySum += productivity;
      dayStats.count++;
      dayStats.scores.push(productivity);
    });

    // Process hourly patterns
    const hourlyPatterns = Array.from(hourlyData.entries()).map(([hour, stats]) => ({
      hour,
      averageProductivity: stats.productivitySum / stats.count,
      consistency: this.calculateConsistency(stats.scores),
      sampleSize: stats.count
    })).sort((a, b) => b.averageProductivity - a.averageProductivity);

    // Identify peak hours
    const peakHours = hourlyPatterns.slice(0, 3);
    const lowHours = hourlyPatterns.slice(-3);

    return {
      hourlyPatterns,
      peakProductivityHours: peakHours,
      lowProductivityHours: lowHours,
      circadianRhythm: this.identifyCircadianPattern(hourlyPatterns),
      temporalRecommendations: this.generateTemporalRecommendations(hourlyPatterns)
    };
  }

  /**
   * Identify distraction patterns
   */
  async identifyDistractionPatterns(screenshots) {
    const distractions = [];
    const distractionSources = new Map();

    screenshots.forEach((screenshot, index) => {
      const productivity = screenshot.productivity_score || 0;
      const app = this.extractPrimaryApplication(screenshot);
      
      // Identify potential distractions (low productivity scores)
      if (productivity < 4) {
        const distraction = {
          timestamp: screenshot.timestamp,
          productivity: productivity,
          application: app,
          index: index,
          duration: this.estimateDistractionDuration(screenshots, index),
          type: this.classifyDistraction(screenshot)
        };
        
        distractions.push(distraction);
        
        // Track distraction sources
        const source = distraction.type;
        if (!distractionSources.has(source)) {
          distractionSources.set(source, { count: 0, totalDuration: 0, avgProductivity: 0 });
        }
        const sourceStats = distractionSources.get(source);
        sourceStats.count++;
        sourceStats.totalDuration += distraction.duration;
        sourceStats.avgProductivity = (sourceStats.avgProductivity * (sourceStats.count - 1) + productivity) / sourceStats.count;
      }
    });

    return {
      totalDistractions: distractions.length,
      distractionRate: distractions.length / screenshots.length,
      averageDistractionDuration: distractions.length > 0 ? 
        distractions.reduce((sum, d) => sum + d.duration, 0) / distractions.length : 0,
      distractionSources: Array.from(distractionSources.entries())
        .sort(([,a], [,b]) => b.count - a.count)
        .map(([source, stats]) => ({ source, ...stats })),
      distractionHotspots: this.identifyDistractionHotspots(distractions),
      recoveryPatterns: this.analyzeDistractionRecovery(screenshots, distractions)
    };
  }

  /**
   * Identify workflow patterns
   */
  async identifyWorkflowPatterns(screenshots) {
    const workflows = [];
    const activitySequences = this.extractActivitySequences(screenshots);
    
    // Group similar sequences
    const sequenceGroups = this.groupSimilarSequences(activitySequences);
    
    sequenceGroups.forEach(group => {
      if (group.sequences.length >= 2) { // Pattern if it occurs at least twice
        workflows.push({
          pattern: group.pattern,
          frequency: group.sequences.length,
          averageProductivity: group.sequences.reduce((sum, seq) => 
            sum + seq.averageProductivity, 0) / group.sequences.length,
          duration: group.sequences.reduce((sum, seq) => 
            sum + seq.duration, 0) / group.sequences.length,
          efficiency: this.calculateWorkflowEfficiency(group.sequences)
        });
      }
    });

    return {
      identifiedWorkflows: workflows.sort((a, b) => b.frequency - a.frequency),
      mostEfficientWorkflows: workflows
        .filter(w => w.frequency >= 2)
        .sort((a, b) => b.efficiency - a.efficiency)
        .slice(0, 5),
      workflowRecommendations: this.generateWorkflowRecommendations(workflows)
    };
  }

  // Helper methods

  finalizeFocusSession(session) {
    return {
      ...session,
      duration: session.endTime - session.startTime,
      efficiency: session.averageProductivity / (session.interruptions + 1),
      qualityScore: this.calculateSessionQuality(session)
    };
  }

  calculateFocusEfficiency(sessions) {
    if (sessions.length === 0) return 0;
    return sessions.reduce((sum, s) => sum + s.efficiency, 0) / sessions.length;
  }

  extractPrimaryApplication(screenshot) {
    // Extract application from screenshot analysis
    if (screenshot.applications && screenshot.applications.length > 0) {
      return screenshot.applications[0];
    }
    
    // Fallback: try to extract from window title or other metadata
    if (screenshot.windowTitle) {
      return this.inferApplicationFromTitle(screenshot.windowTitle);
    }
    
    return 'unknown';
  }

  estimateContextLoss(fromApp, toApp) {
    // Simple heuristic for context switching cost
    const relatedApps = {
      'browser': ['editor', 'terminal'],
      'editor': ['browser', 'terminal'],
      'terminal': ['editor', 'browser']
    };
    
    if (relatedApps[fromApp]?.includes(toApp)) {
      return 0.3; // Low context loss for related apps
    } else if (fromApp === toApp) {
      return 0; // No context loss
    } else {
      return 0.8; // High context loss for unrelated apps
    }
  }

  classifySwitchType(fromApp, toApp) {
    const productiveApps = ['editor', 'terminal', 'browser'];
    const communicationApps = ['slack', 'teams', 'email'];
    const distractingApps = ['social', 'entertainment', 'games'];
    
    if (productiveApps.includes(fromApp) && productiveApps.includes(toApp)) {
      return 'contextual';
    } else if (communicationApps.includes(toApp)) {
      return 'communication';
    } else if (distractingApps.includes(toApp)) {
      return 'distracting';
    } else {
      return 'neutral';
    }
  }

  groupByTimeSlots(screenshots, slotDuration) {
    const slots = new Map();
    
    screenshots.forEach(screenshot => {
      const timestamp = screenshot.timestamp || Date.now();
      const slotKey = Math.floor(timestamp / slotDuration) * slotDuration;
      
      if (!slots.has(slotKey)) {
        slots.set(slotKey, []);
      }
      slots.get(slotKey).push(screenshot);
    });
    
    return slots;
  }

  calculateConsistency(scores) {
    if (scores.length < 2) return 1;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalize consistency score (lower standard deviation = higher consistency)
    return Math.max(0, 1 - (stdDev / 10));
  }

  findDominantActivity(screenshots) {
    const activities = new Map();
    
    screenshots.forEach(screenshot => {
      const activity = screenshot.activity_type || 'unknown';
      activities.set(activity, (activities.get(activity) || 0) + 1);
    });
    
    return Array.from(activities.entries())
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';
  }

  calculateProductivityTrend(rhythms) {
    if (rhythms.length < 3) return 'stable';
    
    const firstHalf = rhythms.slice(0, Math.floor(rhythms.length / 2));
    const secondHalf = rhythms.slice(Math.floor(rhythms.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, r) => sum + r.averageProductivity, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, r) => sum + r.averageProductivity, 0) / secondHalf.length;
    
    const diff = secondAvg - firstAvg;
    if (diff > 1) return 'improving';
    if (diff < -1) return 'declining';
    return 'stable';
  }

  rateAppProductivity(avgProductivity) {
    if (avgProductivity >= 8) return 'excellent';
    if (avgProductivity >= 6) return 'good';
    if (avgProductivity >= 4) return 'moderate';
    return 'poor';
  }

  calculateApplicationEfficiency(appAnalysis) {
    const totalUsage = appAnalysis.reduce((sum, app) => sum + app.usageCount, 0);
    const weightedProductivity = appAnalysis.reduce((sum, app) => 
      sum + (app.averageProductivity * app.usageCount), 0);
    
    return totalUsage > 0 ? weightedProductivity / totalUsage : 0;
  }

  identifyCircadianPattern(hourlyPatterns) {
    const morningAvg = hourlyPatterns
      .filter(p => p.hour >= 6 && p.hour < 12)
      .reduce((sum, p) => sum + p.averageProductivity, 0) / 
      hourlyPatterns.filter(p => p.hour >= 6 && p.hour < 12).length;
    
    const afternoonAvg = hourlyPatterns
      .filter(p => p.hour >= 12 && p.hour < 18)
      .reduce((sum, p) => sum + p.averageProductivity, 0) / 
      hourlyPatterns.filter(p => p.hour >= 12 && p.hour < 18).length;
    
    const eveningAvg = hourlyPatterns
      .filter(p => p.hour >= 18 && p.hour < 24)
      .reduce((sum, p) => sum + p.averageProductivity, 0) / 
      hourlyPatterns.filter(p => p.hour >= 18 && p.hour < 24).length;
    
    if (morningAvg > afternoonAvg && morningAvg > eveningAvg) {
      return 'morning_person';
    } else if (afternoonAvg > morningAvg && afternoonAvg > eveningAvg) {
      return 'afternoon_peak';
    } else if (eveningAvg > morningAvg && eveningAvg > afternoonAvg) {
      return 'evening_person';
    } else {
      return 'consistent';
    }
  }

  classifyDistraction(screenshot) {
    const app = this.extractPrimaryApplication(screenshot);
    const productivity = screenshot.productivity_score || 0;
    
    if (app.includes('social') || app.includes('twitter') || app.includes('facebook')) {
      return 'social_media';
    } else if (app.includes('youtube') || app.includes('netflix')) {
      return 'entertainment';
    } else if (productivity < 2) {
      return 'severe_distraction';
    } else {
      return 'mild_distraction';
    }
  }

  estimateDistractionDuration(screenshots, index) {
    // Estimate how long the distraction lasted
    let duration = 0;
    const DISTRACTION_THRESHOLD = 4;
    
    for (let i = index; i < screenshots.length - 1; i++) {
      if ((screenshots[i].productivity_score || 0) < DISTRACTION_THRESHOLD) {
        const timeDiff = (screenshots[i + 1].timestamp || Date.now()) - 
                        (screenshots[i].timestamp || Date.now());
        duration += timeDiff;
      } else {
        break;
      }
    }
    
    return duration;
  }

  identifyDistractionHotspots(distractions) {
    const hourlyDistractions = new Map();
    
    distractions.forEach(distraction => {
      const hour = new Date(distraction.timestamp).getHours();
      hourlyDistractions.set(hour, (hourlyDistractions.get(hour) || 0) + 1);
    });
    
    return Array.from(hourlyDistractions.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({ hour, distractionCount: count }));
  }

  analyzeDistractionRecovery(screenshots, distractions) {
    const recoveryTimes = [];
    
    distractions.forEach(distraction => {
      const distractionIndex = distraction.index;
      const RECOVERY_THRESHOLD = 6;
      
      // Find when productivity recovers
      for (let i = distractionIndex + 1; i < screenshots.length; i++) {
        if ((screenshots[i].productivity_score || 0) >= RECOVERY_THRESHOLD) {
          const recoveryTime = (screenshots[i].timestamp || Date.now()) - 
                              (screenshots[distractionIndex].timestamp || Date.now());
          recoveryTimes.push(recoveryTime);
          break;
        }
      }
    });
    
    return {
      averageRecoveryTime: recoveryTimes.length > 0 ? 
        recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length : 0,
      recoveryRate: recoveryTimes.length / distractions.length
    };
  }

  extractActivitySequences(screenshots) {
    const sequences = [];
    let currentSequence = [];
    let lastActivity = null;
    
    screenshots.forEach(screenshot => {
      const activity = screenshot.activity_type || 'unknown';
      
      if (activity !== lastActivity) {
        if (currentSequence.length > 0) {
          sequences.push(this.finalizeSequence(currentSequence));
        }
        currentSequence = [screenshot];
      } else {
        currentSequence.push(screenshot);
      }
      
      lastActivity = activity;
    });
    
    if (currentSequence.length > 0) {
      sequences.push(this.finalizeSequence(currentSequence));
    }
    
    return sequences;
  }

  finalizeSequence(screenshots) {
    const totalProductivity = screenshots.reduce((sum, s) => sum + (s.productivity_score || 0), 0);
    const startTime = screenshots[0].timestamp || Date.now();
    const endTime = screenshots[screenshots.length - 1].timestamp || Date.now();
    
    return {
      activity: screenshots[0].activity_type || 'unknown',
      duration: endTime - startTime,
      averageProductivity: totalProductivity / screenshots.length,
      screenshotCount: screenshots.length
    };
  }

  groupSimilarSequences(sequences) {
    const groups = new Map();
    
    sequences.forEach(sequence => {
      const pattern = sequence.activity;
      
      if (!groups.has(pattern)) {
        groups.set(pattern, { pattern, sequences: [] });
      }
      groups.get(pattern).sequences.push(sequence);
    });
    
    return Array.from(groups.values());
  }

  calculateWorkflowEfficiency(sequences) {
    const totalDuration = sequences.reduce((sum, seq) => sum + seq.duration, 0);
    const totalProductivity = sequences.reduce((sum, seq) => 
      sum + (seq.averageProductivity * seq.duration), 0);
    
    return totalDuration > 0 ? totalProductivity / totalDuration : 0;
  }

  calculateTimeSpan(screenshots) {
    if (screenshots.length < 2) return 0;
    
    const timestamps = screenshots.map(s => s.timestamp || Date.now()).sort((a, b) => a - b);
    return timestamps[timestamps.length - 1] - timestamps[0];
  }

  calculatePatternConfidence(patterns) {
    let confidence = 0;
    let factors = 0;
    
    if (patterns.focusPatterns?.sessions?.length > 0) {
      confidence += 20;
      factors++;
    }
    if (patterns.taskSwitchingPatterns?.totalSwitches > 0) {
      confidence += 15;
      factors++;
    }
    if (patterns.productivityRhythms?.timeSlotAnalysis?.length > 3) {
      confidence += 25;
      factors++;
    }
    if (patterns.applicationPatterns?.applicationStats?.length > 2) {
      confidence += 20;
      factors++;
    }
    if (patterns.temporalPatterns?.hourlyPatterns?.length > 4) {
      confidence += 20;
      factors++;
    }
    
    return factors > 0 ? confidence / factors : 0;
  }

  inferApplicationFromTitle(title) {
    const patterns = {
      'code': /code|vscode|visual studio/i,
      'browser': /chrome|firefox|safari|edge/i,
      'terminal': /terminal|cmd|powershell|bash/i,
      'slack': /slack/i,
      'zoom': /zoom/i,
      'email': /mail|outlook/i,
      'figma': /figma/i,
      'notion': /notion/i
    };
    
    for (const [app, pattern] of Object.entries(patterns)) {
      if (pattern.test(title)) {
        return app;
      }
    }
    
    return 'unknown';
  }

  calculateSessionQuality(session) {
    const durationScore = Math.min(session.duration / (30 * 60 * 1000), 1) * 40; // Up to 40 points for 30+ min
    const productivityScore = (session.averageProductivity / 10) * 40; // Up to 40 points for perfect productivity
    const interruptionPenalty = Math.max(0, 20 - (session.interruptions * 5)); // Lose 5 points per interruption
    
    return Math.min(100, durationScore + productivityScore + interruptionPenalty);
  }

  calculateSwitchingEfficiency(switches) {
    if (switches.length === 0) return 100;
    
    const contextualSwitches = switches.filter(s => s.switchType === 'contextual').length;
    const distractingSwitches = switches.filter(s => s.switchType === 'distracting').length;
    
    const efficiency = ((contextualSwitches - distractingSwitches) / switches.length) * 100;
    return Math.max(0, Math.min(100, 50 + efficiency)); // Scale to 0-100 with 50 as neutral
  }

  generateRhythmRecommendations(rhythms) {
    const recommendations = [];
    
    const peakHours = rhythms
      .filter(r => r.averageProductivity > 7)
      .map(r => r.timeSlot);
    
    if (peakHours.length > 0) {
      recommendations.push(`Schedule complex tasks during peak hours: ${peakHours.join(', ')}`);
    }
    
    const lowHours = rhythms
      .filter(r => r.averageProductivity < 4)
      .map(r => r.timeSlot);
    
    if (lowHours.length > 0) {
      recommendations.push(`Consider breaks or routine tasks during low periods: ${lowHours.join(', ')}`);
    }
    
    return recommendations;
  }

  generateAppRecommendations(appAnalysis) {
    const recommendations = [];
    
    const lowProductivityApps = appAnalysis
      .filter(app => app.averageProductivity < 5 && app.usagePercentage > 10);
    
    if (lowProductivityApps.length > 0) {
      recommendations.push(`Consider limiting time in: ${lowProductivityApps.map(a => a.application).join(', ')}`);
    }
    
    const highProductivityApps = appAnalysis
      .filter(app => app.averageProductivity > 7)
      .slice(0, 3);
    
    if (highProductivityApps.length > 0) {
      recommendations.push(`Maximize time in productive apps: ${highProductivityApps.map(a => a.application).join(', ')}`);
    }
    
    return recommendations;
  }

  generateTemporalRecommendations(hourlyPatterns) {
    const recommendations = [];
    
    const bestHour = hourlyPatterns[0];
    if (bestHour) {
      recommendations.push(`Peak productivity at ${bestHour.hour}:00 - schedule important work then`);
    }
    
    const worstHour = hourlyPatterns[hourlyPatterns.length - 1];
    if (worstHour && worstHour.averageProductivity < 5) {
      recommendations.push(`Low productivity at ${worstHour.hour}:00 - consider breaks or light tasks`);
    }
    
    return recommendations;
  }

  generateWorkflowRecommendations(workflows) {
    const recommendations = [];
    
    const efficientWorkflows = workflows
      .filter(w => w.efficiency > 0.7)
      .slice(0, 3);
    
    if (efficientWorkflows.length > 0) {
      recommendations.push(`Maintain efficient workflows: ${efficientWorkflows.map(w => w.pattern).join(', ')}`);
    }
    
    const inefficientWorkflows = workflows
      .filter(w => w.efficiency < 0.4)
      .slice(0, 2);
    
    if (inefficientWorkflows.length > 0) {
      recommendations.push(`Optimize workflows: ${inefficientWorkflows.map(w => w.pattern).join(', ')}`);
    }
    
    return recommendations;
  }
}

module.exports = PatternRecognizer;