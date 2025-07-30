/**
 * Advanced AI prompts for sophisticated activity analysis
 * Uses Gemini's multimodal capabilities for detailed screen content analysis
 */

class ActivityPrompts {
  /**
   * Master prompt for comprehensive screenshot analysis
   * Analyzes visual cues, application context, and productivity indicators
   */
  static getScreenshotAnalysisPrompt() {
    return `You are an expert activity analyzer specializing in workplace productivity and digital behavior patterns. Analyze this screenshot with extreme attention to detail.

ANALYSIS FRAMEWORK:

## 1. APPLICATION CONTEXT DETECTION
- Identify the primary application(s) in use
- Determine the specific functionality being used within each app
- Assess the complexity level of the current task
- Identify any secondary applications or background processes

## 2. WORK TYPE CLASSIFICATION
Classify the activity into one of these detailed categories:
- **Deep Work**: Complex coding, writing, analysis, design work
- **Communication**: Email, messaging, video calls, collaboration
- **Research**: Reading, browsing, information gathering, PDF review
- **Administrative**: File management, settings, routine tasks
- **Learning**: Tutorials, documentation, educational content
- **Creative**: Design, multimedia editing, content creation
- **Planning**: Project management, scheduling, organization
- **Distraction**: Social media, entertainment, non-work content

## 3. PRODUCTIVITY ASSESSMENT
Rate productivity level (1-10) based on:
- Task complexity and cognitive load
- Alignment with typical work activities
- Presence of distracting elements
- Quality of focus indicators

## 4. FOCUS & ATTENTION ANALYSIS
- **Focus Quality**: Deep, moderate, fragmented, or distracted
- **Multitasking Level**: Single-task, light multitasking, heavy multitasking
- **Attention Indicators**: Full-screen apps, multiple windows, notification presence
- **Cognitive Load**: Low, moderate, high based on visual complexity

## 5. VISUAL CUE ANALYSIS
Examine specific visual elements:
- Text density and complexity
- Code patterns or technical content
- Creative assets or media
- UI complexity and information density
- Error states or system notifications

## 6. TEMPORAL CONTEXT CLUES
Look for indicators of:
- Time of day relevance
- Meeting or deadline pressure
- Workflow stage (beginning, middle, completion)
- Task switching patterns

## 7. PERSONALIZATION MARKERS
Identify patterns that suggest:
- Individual work style preferences
- Skill level indicators
- Domain expertise areas
- Workflow optimization opportunities

RESPONSE FORMAT:
Provide a comprehensive analysis covering all framework elements. Be specific about what you observe and make data-driven assessments. Focus on actionable insights that could help optimize productivity.`;
  }

  /**
   * Specialized prompt for pattern recognition across multiple screenshots
   */
  static getPatternAnalysisPrompt(timeframe = '1 hour') {
    return `You are analyzing a sequence of screenshots to identify productivity patterns and behavioral insights over ${timeframe}.

PATTERN ANALYSIS OBJECTIVES:

## 1. WORKFLOW PATTERNS
- Identify recurring task sequences
- Map application switching patterns  
- Detect workflow optimization opportunities
- Recognize productivity rhythms and cycles

## 2. FOCUS PATTERN ANALYSIS
- Calculate focus session durations
- Identify distraction triggers and patterns
- Map attention quality fluctuations
- Detect optimal focus periods

## 3. PRODUCTIVITY TRENDS
- Track productivity score variations
- Identify peak performance periods
- Recognize productivity dips and causes
- Map energy level indicators

## 4. BEHAVIORAL INSIGHTS
- Application usage preferences
- Multitasking tendencies
- Break patterns and frequency
- Context switching efficiency

## 5. OPTIMIZATION RECOMMENDATIONS
Based on patterns, suggest:
- Optimal work scheduling
- Distraction mitigation strategies
- Workflow improvements
- Focus enhancement techniques

Analyze the provided screenshot sequence and deliver insights that would help optimize the user's productivity and work patterns.`;
  }

  /**
   * Deep contextual analysis for specific work domains
   */
  static getContextualAnalysisPrompt(domain = 'general') {
    const domainSpecifics = {
      coding: `
## SOFTWARE DEVELOPMENT CONTEXT
- Programming language identification
- Code complexity assessment
- Development tool usage patterns
- Debugging vs. coding vs. testing activities
- Documentation and research integration
- Version control and collaboration patterns`,
      
      writing: `
## WRITING & CONTENT CREATION CONTEXT  
- Document type and complexity
- Research integration patterns
- Editing vs. drafting phases
- Reference material usage
- Creative flow indicators
- Collaboration and review activities`,
      
      research: `
## RESEARCH & ANALYSIS CONTEXT
- Information source diversity
- Note-taking and organization patterns
- Cross-referencing behaviors
- Synthesis and analysis activities
- Knowledge management approaches
- Fact-checking and verification patterns`,
      
      design: `
## DESIGN & CREATIVE CONTEXT
- Creative tool usage patterns
- Design iteration cycles
- Reference and inspiration gathering
- Collaboration and feedback integration
- Asset management behaviors
- Creative flow state indicators`,
      
      general: `
## GENERAL WORK CONTEXT
- Task type identification
- Work phase recognition
- Resource utilization patterns
- Collaboration indicators
- Learning and skill development signs`
    };

    return `You are a specialist in analyzing ${domain} work activities. Provide deep contextual analysis of this screenshot.

${domainSpecifics[domain] || domainSpecifics.general}

## DOMAIN-SPECIFIC PRODUCTIVITY METRICS
- Task completion progress indicators
- Quality of work environment setup
- Tool utilization efficiency
- Knowledge work depth assessment
- Creative or analytical thinking evidence

## SKILL & EXPERTISE INDICATORS
- Advanced feature usage
- Professional workflow patterns
- Domain knowledge application
- Problem-solving approach quality
- Learning and adaptation signs

Provide insights specific to ${domain} work optimization and professional development opportunities.`;
  }

  /**
   * Temporal analysis for understanding time-based productivity patterns
   */
  static getTemporalAnalysisPrompt() {
    return `You are analyzing screenshot data to understand temporal productivity patterns and optimal working rhythms.

TEMPORAL ANALYSIS FRAMEWORK:

## 1. CIRCADIAN PRODUCTIVITY PATTERNS
- Energy level indicators throughout the day
- Peak performance time identification
- Natural low-energy periods
- Optimal task scheduling insights

## 2. DAILY RHYTHM ANALYSIS
- Morning startup patterns
- Mid-day productivity maintenance
- Afternoon energy management
- End-of-day wind-down activities

## 3. TASK TIMING OPTIMIZATION
- Complex task vs. simple task timing
- Creative work optimal periods
- Administrative task scheduling
- Communication activity patterns

## 4. BREAK AND RECOVERY PATTERNS
- Natural break timing
- Recovery activity effectiveness
- Attention restoration methods
- Sustainable work pace indicators

## 5. WEEKLY AND LONG-TERM PATTERNS
- Monday-Friday productivity variations
- Project phase timing preferences
- Seasonal or long-term trend indicators
- Workload distribution patterns

Analyze the temporal aspects of the provided activity data and suggest evidence-based timing optimizations for peak productivity.`;
  }

  /**
   * Distraction and focus quality analysis
   */
  static getDistractionAnalysisPrompt() {
    return `You are a focus and attention specialist analyzing screenshot data to identify distraction patterns and focus optimization opportunities.

DISTRACTION ANALYSIS FRAMEWORK:

## 1. DISTRACTION SOURCE IDENTIFICATION
- External distractions (notifications, interruptions)
- Internal distractions (task-switching, procrastination)
- Environmental factors affecting focus
- Technology-based distraction patterns

## 2. FOCUS QUALITY METRICS
- Deep work session duration and quality
- Attention residue from task switching
- Concentration depth indicators
- Flow state achievement markers

## 3. CONTEXT SWITCHING ANALYSIS
- Frequency and triggers of task switching
- Cost assessment of attention transitions
- Batching opportunities identification
- Context preservation strategies

## 4. DIGITAL ENVIRONMENT OPTIMIZATION
- Notification management effectiveness
- Workspace organization quality
- Tool and application focus support
- Information architecture efficiency

## 5. BEHAVIORAL INTERVENTION OPPORTUNITIES
- Distraction trigger mitigation strategies  
- Focus enhancement technique recommendations
- Environmental modification suggestions
- Habit formation opportunities

Provide detailed analysis of focus patterns and actionable recommendations for minimizing distractions and optimizing attention quality.`;
  }

  /**
   * Productivity scoring algorithm prompt
   */
  static getProductivityScoringPrompt() {
    return `You are a productivity assessment specialist. Analyze this screenshot and provide a detailed productivity score using the following sophisticated scoring algorithm:

PRODUCTIVITY SCORING FRAMEWORK (0-100 scale):

## BASE PRODUCTIVITY SCORE (0-40 points)
- **Deep Work Activities** (35-40 pts): Complex coding, writing, analysis, design
- **Focused Work Activities** (25-35 pts): Moderate complexity tasks requiring concentration  
- **Routine Work Activities** (15-25 pts): Administrative, simple tasks, email processing
- **Communication Activities** (10-20 pts): Meetings, collaboration, messaging
- **Learning Activities** (20-30 pts): Reading documentation, tutorials, skill building
- **Distraction Activities** (0-10 pts): Social media, entertainment, personal browsing

## FOCUS QUALITY MULTIPLIER (0.5x - 1.5x)
- **Single-task focus** (1.3-1.5x): Full attention on one primary activity
- **Light multitasking** (1.0-1.2x): 2-3 related applications, managed switching
- **Heavy multitasking** (0.7-0.9x): Multiple unrelated tasks, frequent switching
- **Distracted state** (0.5-0.6x): Notifications, interruptions, scattered attention

## COMPLEXITY BONUS (0-20 points)
- **High cognitive load** (+15-20 pts): Complex problem-solving, creative work
- **Moderate complexity** (+8-15 pts): Structured tasks requiring thinking
- **Low complexity** (+0-8 pts): Routine or simple tasks

## EFFICIENCY INDICATORS (0-15 points)
- **Optimized workspace** (+10-15 pts): Clean interface, relevant tools visible
- **Professional tools** (+5-10 pts): Industry-standard applications, proper setup
- **Good organization** (+3-8 pts): Logical file/window organization
- **Poor organization** (0-3 pts): Cluttered, inefficient setup

## DEDUCTION FACTORS (-5 to -30 points)
- **Social media presence** (-10 to -20 pts): Depending on prominence
- **Entertainment content** (-15 to -30 pts): Games, videos, non-work content
- **System issues** (-5 to -15 pts): Errors, crashes, technical problems
- **Obvious procrastination** (-10 to -25 pts): Avoidance behaviors, time-wasting

CALCULATION METHOD:
1. Assign base score based on primary activity
2. Apply focus quality multiplier
3. Add complexity bonus
4. Add efficiency indicators
5. Apply deduction factors
6. Cap final score between 0-100

Provide the final productivity score with detailed breakdown of how each component contributed to the score.`;
  }

  /**
   * Application-specific analysis prompts
   */
  static getApplicationAnalysisPrompt(appName) {
    const appSpecifics = {
      vscode: `Analyze this VS Code screenshot for:
- Language being used and complexity
- Feature utilization (extensions, debugger, integrated terminal)
- Code quality indicators
- Development workflow stage
- Problem-solving vs. routine coding`,

      browser: `Analyze this browser screenshot for:
- Website categories and work relevance
- Research vs. distraction indicators
- Tab management and organization
- Information consumption patterns
- Learning vs. entertainment content`,

      slack: `Analyze this Slack screenshot for:
- Communication effectiveness indicators
- Channel relevance to work
- Message complexity and importance
- Collaboration activity level
- Meeting or urgent communication signs`,

      zoom: `Analyze this Zoom screenshot for:
- Meeting type and formality level
- Participation level indicators
- Screen sharing or presentation mode
- Meeting effectiveness signs
- Attention and engagement quality`,

      notion: `Analyze this Notion screenshot for:
- Documentation vs. planning activity
- Information organization quality
- Knowledge management effectiveness
- Collaboration and sharing indicators
- Content creation vs. consumption`,

      figma: `Analyze this Figma screenshot for:
- Design complexity and stage
- Collaboration activity level
- Creative process indicators
- Tool utilization efficiency
- Design thinking and iteration signs`
    };

    return appSpecifics[appName.toLowerCase()] || `Analyze this ${appName} screenshot for work-relevant productivity indicators and usage patterns.`;
  }
}

module.exports = ActivityPrompts;