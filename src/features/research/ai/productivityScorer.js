/**
 * Sophisticated Productivity Scoring System
 * Combines multiple algorithms to generate nuanced productivity scores
 */

class ProductivityScorer {
  constructor() {
    this.weights = {
      application: 0.25,    // Weight for application-based scoring
      visual: 0.25,         // Weight for visual complexity analysis
      temporal: 0.20,       // Weight for time-based factors
      behavioral: 0.15,     // Weight for behavioral patterns
      contextual: 0.15      // Weight for contextual factors
    };

    // Application productivity ratings
    this.appProductivityRatings = {
      // Development tools
      'vscode': 9, 'visual studio': 9, 'intellij': 9, 'sublime': 8,
      'vim': 9, 'emacs': 9, 'atom': 7, 'notepad++': 6,
      'terminal': 8, 'cmd': 7, 'powershell': 8, 'bash': 8,
      'git': 8, 'docker': 7, 'postman': 7,

      // Browsers (context-dependent)
      'chrome': 5, 'firefox': 5, 'safari': 5, 'edge': 5,
      
      // Communication
      'slack': 6, 'teams': 6, 'discord': 4, 'telegram': 4,
      'skype': 6, 'zoom': 7, 'meet': 7, 'webex': 7,
      'email': 6, 'outlook': 6, 'gmail': 5,

      // Design & Creative
      'figma': 8, 'sketch': 8, 'photoshop': 8, 'illustrator': 8,
      'aftereffects': 7, 'premiere': 7, 'blender': 8,

      // Productivity & Documentation
      'notion': 7, 'obsidian': 8, 'onenote': 6, 'evernote': 6,
      'word': 7, 'docs': 7, 'sheets': 7, 'excel': 7,
      'powerpoint': 6, 'slides': 6,

      // Entertainment (low productivity)
      'youtube': 2, 'netflix': 1, 'spotify': 3, 'twitch': 1,
      'instagram': 1, 'twitter': 2, 'facebook': 1, 'tiktok': 1,
      'reddit': 2, 'pinterest': 2,

      // Games (very low productivity)
      'steam': 1, 'epic': 1, 'origin': 1, 'battle.net': 1,
      
      // System & Utilities
      'finder': 4, 'explorer': 4, 'settings': 3, 'control panel': 3,
      'task manager': 3, 'system preferences': 3
    };

    // Time-based productivity modifiers
    this.timeModifiers = {
      earlyMorning: { start: 5, end: 8, modifier: 1.1 },   // 5-8 AM: slight boost
      morning: { start: 8, end: 12, modifier: 1.2 },       // 8-12 PM: high productivity
      earlyAfternoon: { start: 12, end: 14, modifier: 0.9 }, // 12-2 PM: post-lunch dip
      afternoon: { start: 14, end: 17, modifier: 1.1 },    // 2-5 PM: good productivity
      evening: { start: 17, end: 20, modifier: 0.95 },     // 5-8 PM: winding down
      night: { start: 20, end: 24, modifier: 0.8 },        // 8-12 AM: lower productivity
      lateNight: { start: 0, end: 5, modifier: 0.6 }       // 12-5 AM: very low productivity
    };
  }

  /**
   * Calculate comprehensive productivity score
   * @param {string} base64Image - Screenshot data
   * @param {Object} context - Context information
   * @returns {Object} Detailed scoring breakdown
   */
  async calculateScore(base64Image, context = {}) {
    try {
      const components = {
        application: await this.calculateApplicationScore(context),
        visual: await this.calculateVisualScore(base64Image, context),
        temporal: this.calculateTemporalScore(context),
        behavioral: this.calculateBehavioralScore(context),
        contextual: this.calculateContextualScore(context)
      };

      // Calculate weighted final score
      let finalScore = 0;
      const breakdown = {};
      
      for (const [component, score] of Object.entries(components)) {
        const weightedScore = score.score * this.weights[component];
        finalScore += weightedScore;
        breakdown[component] = {
          rawScore: score.score,
          weight: this.weights[component],
          weightedScore: weightedScore,
          factors: score.factors,
          confidence: score.confidence || 0.8
        };
      }

      // Apply global modifiers
      const modifiers = this.calculateGlobalModifiers(context);
      finalScore *= modifiers.multiplier;

      // Ensure score is within bounds
      finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

      return {
        score: finalScore,
        breakdown: breakdown,
        modifiers: modifiers,
        confidence: this.calculateOverallConfidence(breakdown),
        timestamp: context.timestamp || Date.now(),
        algorithm_version: '2.0'
      };
    } catch (error) {
      console.error('[ProductivityScorer] Scoring failed:', error);
      return {
        score: 50, // Default neutral score
        error: error.message,
        confidence: 0.1
      };
    }
  }

  /**
   * Calculate application-based productivity score
   */
  async calculateApplicationScore(context) {
    const factors = {};
    let score = 50; // Default neutral score
    let confidence = 0.5;

    // Primary application scoring
    if (context.activeApplication) {
      const app = context.activeApplication.toLowerCase();
      const baseScore = this.getApplicationScore(app);
      score = baseScore * 10; // Scale to 0-100
      factors.primaryApp = { app, score: baseScore };
      confidence = 0.8;

      // Browser context refinement
      if (this.isBrowserApp(app) && context.windowTitle) {
        const browserScore = this.refineBrowserScore(context.windowTitle);
        score = browserScore * 10;
        factors.browserContext = browserScore;
        confidence = 0.9;
      }

      // Multi-application penalty/bonus
      if (context.visibleApplications && context.visibleApplications.length > 1) {
        const multitaskingPenalty = this.calculateMultitaskingPenalty(context.visibleApplications);
        score *= multitaskingPenalty;
        factors.multitasking = multitaskingPenalty;
      }
    }

    // Application switching penalty
    if (context.recentSwitches && context.recentSwitches > 3) {
      const switchPenalty = Math.max(0.7, 1 - (context.recentSwitches * 0.05));
      score *= switchPenalty;
      factors.switchingPenalty = switchPenalty;
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      factors,
      confidence
    };
  }

  /**
   * Calculate visual complexity-based productivity score
   */
  async calculateVisualScore(base64Image, context) {
    const factors = {};
    let score = 50;
    let confidence = 0.6;

    try {
      // This would ideally use computer vision, but we'll use heuristics
      // based on image properties and context clues

      // Text density estimation (higher text density often means more work)
      if (context.hasText !== undefined) {
        const textDensityScore = this.estimateTextDensityScore(context);
        score += textDensityScore;
        factors.textDensity = textDensityScore;
      }

      // UI complexity (more complex UIs often indicate professional tools)
      if (context.uiComplexity) {
        const complexityScore = this.calculateUIComplexityScore(context.uiComplexity);
        score += complexityScore;
        factors.uiComplexity = complexityScore;
      }

      // Code detection (presence of code suggests high productivity)
      if (context.hasCode || this.detectCodePatterns(context)) {
        score += 20;
        factors.codePresence = true;
        confidence = 0.9;
      }

      // Media content detection (images/videos might indicate lower productivity)
      if (context.hasMedia) {
        const mediaType = this.classifyMediaContent(context);
        const mediaScore = this.getMediaProductivityScore(mediaType);
        score += mediaScore;
        factors.mediaContent = { type: mediaType, score: mediaScore };
      }

      // Error states or loading screens (indicate interruptions)
      if (context.hasErrors || context.isLoading) {
        score -= 15;
        factors.systemIssues = true;
      }

      // Full-screen vs windowed mode
      if (context.isFullscreen) {
        score += 10; // Full-screen often indicates focus
        factors.fullscreen = true;
      }

    } catch (error) {
      console.error('[ProductivityScorer] Visual analysis error:', error);
      confidence = 0.3;
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      factors,
      confidence
    };
  }

  /**
   * Calculate temporal (time-based) productivity score
   */
  calculateTemporalScore(context) {
    const factors = {};
    let score = 50;
    const confidence = 0.9;

    // Time of day modifier
    if (context.timestamp) {
      const hour = new Date(context.timestamp).getHours();
      const timeModifier = this.getTimeModifier(hour);
      score *= timeModifier.modifier;
      factors.timeOfDay = {
        hour,
        period: timeModifier.period,
        modifier: timeModifier.modifier
      };
    }

    // Day of week modifier
    if (context.timestamp) {
      const dayOfWeek = new Date(context.timestamp).getDay();
      const dayModifier = this.getDayModifier(dayOfWeek);
      score *= dayModifier;
      factors.dayOfWeek = { day: dayOfWeek, modifier: dayModifier };
    }

    // Session duration bonus (longer focused sessions are more productive)
    if (context.sessionDuration) {
      const durationBonus = this.calculateDurationBonus(context.sessionDuration);
      score += durationBonus;
      factors.sessionDuration = durationBonus;
    }

    // Break pattern analysis
    if (context.timeSinceLastBreak) {
      const breakScore = this.calculateBreakScore(context.timeSinceLastBreak);
      score *= breakScore;
      factors.breakPattern = breakScore;
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      factors,
      confidence
    };
  }

  /**
   * Calculate behavioral pattern-based score
   */
  calculateBehavioralScore(context) {
    const factors = {};
    let score = 50;
    const confidence = 0.7;

    // Typing/activity indicators
    if (context.keyboardActivity) {
      const activityScore = this.calculateActivityScore(context.keyboardActivity);
      score += activityScore;
      factors.keyboardActivity = activityScore;
    }

    // Mouse movement patterns
    if (context.mouseActivity) {
      const mouseScore = this.calculateMouseScore(context.mouseActivity);
      score += mouseScore;
      factors.mouseActivity = mouseScore;
    }

    // Application usage patterns
    if (context.usageHistory) {
      const patternScore = this.calculateUsagePatternScore(context.usageHistory);
      score += patternScore;
      factors.usagePatterns = patternScore;
    }

    // Focus consistency
    if (context.focusMetrics) {
      const focusScore = this.calculateFocusScore(context.focusMetrics);
      score += focusScore;
      factors.focusConsistency = focusScore;
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      factors,
      confidence
    };
  }

  /**
   * Calculate contextual factors score
   */
  calculateContextualScore(context) {
    const factors = {};
    let score = 50;
    const confidence = 0.6;

    // Project context
    if (context.projectContext) {
      const projectScore = this.calculateProjectScore(context.projectContext);
      score += projectScore;
      factors.projectContext = projectScore;
    }

    // Meeting/collaboration context
    if (context.meetingActive) {
      score += 15; // Meetings are generally productive
      factors.meetingContext = true;
    }

    // Notification/interruption context
    if (context.notificationCount) {
      const interruptionPenalty = Math.min(20, context.notificationCount * 2);
      score -= interruptionPenalty;
      factors.interruptions = interruptionPenalty;
    }

    // Environment factors
    if (context.environmentFactors) {
      const envScore = this.calculateEnvironmentScore(context.environmentFactors);
      score += envScore;
      factors.environment = envScore;
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      factors,
      confidence
    };
  }

  // Helper methods

  getApplicationScore(appName) {
    // Check exact matches first
    if (this.appProductivityRatings[appName]) {
      return this.appProductivityRatings[appName];
    }

    // Check partial matches for complex app names
    for (const [key, value] of Object.entries(this.appProductivityRatings)) {
      if (appName.includes(key) || key.includes(appName)) {
        return value;
      }
    }

    // Default scoring based on app category
    if (appName.includes('dev') || appName.includes('code')) return 8;
    if (appName.includes('browser') || appName.includes('web')) return 5;
    if (appName.includes('social') || appName.includes('media')) return 2;
    if (appName.includes('game')) return 1;
    if (appName.includes('work') || appName.includes('office')) return 7;

    return 5; // Neutral default
  }

  isBrowserApp(app) {
    return ['chrome', 'firefox', 'safari', 'edge', 'browser'].some(browser => 
      app.includes(browser));
  }

  refineBrowserScore(windowTitle) {
    const title = windowTitle.toLowerCase();
    
    // Work-related sites
    if (title.includes('github') || title.includes('gitlab') || title.includes('bitbucket')) return 9;
    if (title.includes('stackoverflow') || title.includes('docs.') || title.includes('documentation')) return 8;
    if (title.includes('jira') || title.includes('trello') || title.includes('asana')) return 7;
    if (title.includes('gmail') || title.includes('outlook') || title.includes('mail')) return 6;
    if (title.includes('calendar') || title.includes('meet') || title.includes('zoom')) return 7;
    
    // Learning/research
    if (title.includes('coursera') || title.includes('udemy') || title.includes('pluralsight')) return 8;
    if (title.includes('medium') || title.includes('dev.to') || title.includes('blog')) return 6;
    if (title.includes('wikipedia') || title.includes('research')) return 6;
    
    // Social/entertainment
    if (title.includes('youtube') && !title.includes('tutorial')) return 2;
    if (title.includes('netflix') || title.includes('hulu') || title.includes('prime')) return 1;
    if (title.includes('facebook') || title.includes('instagram') || title.includes('twitter')) return 1;
    if (title.includes('reddit') && !title.includes('programming')) return 2;
    
    // Shopping/personal
    if (title.includes('amazon') || title.includes('ebay') || title.includes('shopping')) return 2;
    if (title.includes('news') && !title.includes('tech')) return 3;
    
    return 5; // Default browser score
  }

  calculateMultitaskingPenalty(applications) {
    const appCount = applications.length;
    if (appCount <= 2) return 1.0; // No penalty for reasonable multitasking
    if (appCount <= 4) return 0.9; // Light penalty
    if (appCount <= 6) return 0.8; // Moderate penalty
    return 0.7; // Heavy penalty for excessive multitasking
  }

  estimateTextDensityScore(context) {
    if (!context.textMetrics) return 0;
    
    const density = context.textMetrics.density || 0;
    if (density > 0.7) return 15; // High text density (documents, code)
    if (density > 0.4) return 10; // Medium text density
    if (density > 0.1) return 5;  // Some text
    return -5; // Very low text (possibly games/media)
  }

  calculateUIComplexityScore(complexity) {
    if (complexity === 'high') return 10;   // Professional tools
    if (complexity === 'medium') return 5;  // Standard applications
    if (complexity === 'low') return -5;    // Simple/entertainment apps
    return 0;
  }

  detectCodePatterns(context) {
    if (!context.windowTitle) return false;
    
    const codePatterns = [
      /\.js$|\.ts$|\.py$|\.java$|\.cpp$|\.c$|\.h$/,
      /function|class|import|export|const|let|var/,
      /if\s*\(|for\s*\(|while\s*\(/,
      /\/\/|\/\*|\*\/|<!--/
    ];
    
    return codePatterns.some(pattern => pattern.test(context.windowTitle));
  }

  classifyMediaContent(context) {
    if (context.videoContent) return 'video';
    if (context.imageContent) return 'image';
    if (context.audioContent) return 'audio';
    return 'unknown';
  }

  getMediaProductivityScore(mediaType) {
    switch (mediaType) {
      case 'video':
        return -10; // Usually distracting
      case 'image':
        return -5;  // Might be work-related (design)
      case 'audio':
        return 0;   // Could be background music
      default:
        return 0;
    }
  }

  getTimeModifier(hour) {
    for (const [period, timeRange] of Object.entries(this.timeModifiers)) {
      if (hour >= timeRange.start && hour < timeRange.end) {
        return { period, modifier: timeRange.modifier };
      }
    }
    return { period: 'unknown', modifier: 1.0 };
  }

  getDayModifier(dayOfWeek) {
    // Monday = 1, Sunday = 0
    const dayModifiers = {
      0: 0.7, // Sunday
      1: 1.0, // Monday
      2: 1.1, // Tuesday
      3: 1.1, // Wednesday
      4: 1.0, // Thursday
      5: 0.9, // Friday
      6: 0.8  // Saturday
    };
    
    return dayModifiers[dayOfWeek] || 1.0;
  }

  calculateDurationBonus(duration) {
    const minutes = duration / (1000 * 60);
    if (minutes < 5) return -10;   // Very short sessions
    if (minutes < 15) return 0;    // Normal short sessions
    if (minutes < 30) return 5;    // Good session length
    if (minutes < 60) return 10;   // Great session length
    if (minutes < 120) return 15;  // Excellent focus
    return 20; // Exceptional focus (but check for breaks)
  }

  calculateBreakScore(timeSinceBreak) {
    const minutes = timeSinceBreak / (1000 * 60);
    if (minutes < 30) return 1.0;    // Recent break, good
    if (minutes < 60) return 1.0;    // Acceptable
    if (minutes < 90) return 0.95;   // Should consider a break
    if (minutes < 120) return 0.9;   // Definitely need a break
    return 0.85; // Likely fatigued
  }

  calculateActivityScore(keyboardActivity) {
    const { wpm, consistency, burstiness } = keyboardActivity;
    
    let score = 0;
    
    // WPM scoring
    if (wpm > 60) score += 15;
    else if (wpm > 40) score += 10;
    else if (wpm > 20) score += 5;
    else if (wpm > 0) score += 0;
    else score -= 10; // No typing activity
    
    // Consistency bonus
    if (consistency > 0.8) score += 5;
    else if (consistency < 0.3) score -= 5;
    
    // Burstiness analysis (steady typing vs sporadic)
    if (burstiness > 0.7) score -= 5; // Too sporadic
    else if (burstiness < 0.3) score += 5; // Steady work
    
    return score;
  }

  calculateMouseScore(mouseActivity) {
    const { clickRate, movementPattern, scrollActivity } = mouseActivity;
    
    let score = 0;
    
    // Click rate analysis
    if (clickRate > 2) score -= 5; // Excessive clicking (distraction?)
    else if (clickRate > 0.5) score += 5; // Active interaction
    
    // Movement pattern
    if (movementPattern === 'focused') score += 5;
    else if (movementPattern === 'scattered') score -= 5;
    
    // Scroll activity
    if (scrollActivity === 'reading') score += 5;
    else if (scrollActivity === 'browsing') score += 0;
    else if (scrollActivity === 'excessive') score -= 5;
    
    return score;
  }

  calculateUsagePatternScore(usageHistory) {
    // Analyze historical patterns for consistency
    let score = 0;
    
    if (usageHistory.consistentApps) score += 10;
    if (usageHistory.productiveStreak > 3) score += 5;
    if (usageHistory.distractionRatio < 0.2) score += 5;
    if (usageHistory.focusSessionLength > 30) score += 10;
    
    return score;
  }

  calculateFocusScore(focusMetrics) {
    const { sessionLength, interruptionCount, deepWorkTime } = focusMetrics;
    
    let score = 0;
    
    // Session length bonus
    score += Math.min(15, sessionLength / 2); // Up to 15 points for 30+ min sessions
    
    // Interruption penalty
    score -= interruptionCount * 3;
    
    // Deep work bonus
    if (deepWorkTime > 0.7) score += 10; // 70%+ deep work
    else if (deepWorkTime > 0.5) score += 5; // 50%+ deep work
    
    return score;
  }

  calculateProjectScore(projectContext) {
    let score = 0;
    
    if (projectContext.activeProject) score += 5;
    if (projectContext.complexity === 'high') score += 10;
    else if (projectContext.complexity === 'medium') score += 5;
    
    if (projectContext.deadline === 'urgent') score += 5;
    if (projectContext.priority === 'high') score += 5;
    
    return score;
  }

  calculateEnvironmentScore(environmentFactors) {
    let score = 0;
    
    if (environmentFactors.quietEnvironment) score += 5;
    if (environmentFactors.goodLighting) score += 3;
    if (environmentFactors.comfortableSetup) score += 3;
    if (environmentFactors.minimalDistractions) score += 5;
    
    return score;
  }

  calculateGlobalModifiers(context) {
    let multiplier = 1.0;
    const factors = {};
    
    // Fatigue factor
    if (context.workingHours > 8) {
      const fatigueMultiplier = Math.max(0.7, 1 - ((context.workingHours - 8) * 0.05));
      multiplier *= fatigueMultiplier;
      factors.fatigue = fatigueMultiplier;
    }
    
    // Stress indicators
    if (context.stressIndicators) {
      multiplier *= 0.9;
      factors.stress = true;
    }
    
    // Energy level
    if (context.energyLevel) {
      const energyMultiplier = context.energyLevel / 10;
      multiplier *= energyMultiplier;
      factors.energy = energyMultiplier;
    }
    
    return { multiplier, factors };
  }

  calculateOverallConfidence(breakdown) {
    const confidences = Object.values(breakdown).map(b => b.confidence || 0.5);
    const weights = Object.values(breakdown).map(b => b.weight);
    
    let weightedConfidence = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < confidences.length; i++) {
      weightedConfidence += confidences[i] * weights[i];
      totalWeight += weights[i];
    }
    
    return totalWeight > 0 ? weightedConfidence / totalWeight : 0.5;
  }

  /**
   * Get productivity insights based on score breakdown
   */
  getProductivityInsights(scoreResult) {
    const insights = [];
    const { breakdown, score } = scoreResult;
    
    // Overall score insights
    if (score >= 80) {
      insights.push({ type: 'positive', message: 'Excellent productivity level detected' });
    } else if (score >= 60) {
      insights.push({ type: 'neutral', message: 'Good productivity, with room for improvement' });
    } else if (score >= 40) {
      insights.push({ type: 'warning', message: 'Moderate productivity, consider optimizations' });
    } else {
      insights.push({ type: 'alert', message: 'Low productivity detected, investigate distractions' });
    }
    
    // Component-specific insights
    if (breakdown.application?.rawScore < 40) {
      insights.push({ 
        type: 'recommendation', 
        message: 'Consider switching to more productive applications' 
      });
    }
    
    if (breakdown.temporal?.rawScore < 40) {
      insights.push({ 
        type: 'recommendation', 
        message: 'Consider adjusting work schedule to optimal hours' 
      });
    }
    
    if (breakdown.behavioral?.rawScore > 70) {
      insights.push({ 
        type: 'positive', 
        message: 'Strong focus and behavioral patterns detected' 
      });
    }
    
    return insights;
  }
}

module.exports = ProductivityScorer;