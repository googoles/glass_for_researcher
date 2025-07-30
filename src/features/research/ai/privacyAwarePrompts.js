/**
 * Privacy-Aware AI prompts for high-level activity analysis
 * Focuses on general productivity patterns without revealing specific content
 */

class PrivacyAwarePrompts {
  /**
   * Privacy-focused screenshot analysis prompt
   * Analyzes patterns without describing specific content or text
   */
  static getPrivacyAwareAnalysisPrompt() {
    return `You are an activity pattern analyzer focused on productivity metrics. Analyze this screenshot at a HIGH LEVEL only.

IMPORTANT PRIVACY GUIDELINES:
- DO NOT describe specific text content, file names, or detailed screen content
- DO NOT mention specific websites, documents, or personal information
- Focus ONLY on general activity patterns and productivity indicators
- Use generic terms like "text editor", "web browser", "communication app"

ANALYSIS FRAMEWORK:

## 1. GENERAL ACTIVITY TYPE
Classify into broad categories:
- **Focused Work**: Deep concentration on primary task
- **Communication**: Email, messaging, meetings
- **Research**: Information gathering, reading
- **Administrative**: File management, system tasks
- **Mixed Activity**: Multiple concurrent tasks

## 2. PRODUCTIVITY LEVEL (1-10 scale)
Rate based on:
- Apparent focus level (single task vs multitasking)
- Application type suggests work vs non-work
- Screen organization indicates intentional work
- No specific content analysis needed

## 3. FOCUS QUALITY
- **Deep Focus**: Single application, full attention
- **Moderate Focus**: Few applications, organized workflow
- **Distracted**: Many applications, scattered attention
- **Break/Rest**: Casual browsing or non-work activity

## 4. WORK ENVIRONMENT ASSESSMENT
- **Organized**: Clean, purposeful screen layout
- **Busy**: Multiple tasks, managed complexity
- **Cluttered**: Disorganized, potentially overwhelming
- **Minimal**: Simple, focused setup

RESPONSE FORMAT:
Provide only high-level productivity insights without specific content details. Focus on patterns that help understand work habits without revealing what someone is actually working on.`;
  }

  /**
   * Privacy-focused pattern analysis
   */
  static getPrivacyAwarePatternPrompt(timeframe = '1 hour') {
    return `Analyze productivity patterns over ${timeframe} using these privacy guidelines:

PRIVACY REQUIREMENTS:
- Identify PATTERNS not specific content
- Use general categories for activities
- Focus on timing and behavior trends
- Avoid describing specific applications or content

PATTERN ANALYSIS:

## 1. ACTIVITY FLOW PATTERNS
- Task switching frequency
- Focus session durations
- Break patterns and timing
- Activity type transitions

## 2. PRODUCTIVITY TRENDS
- Consistency of focus levels
- Peak productivity periods
- Energy level fluctuations
- Work-break balance

## 3. BEHAVIORAL INSIGHTS
- Preferred work patterns
- Multitasking tendencies
- Organization habits
- Time management approaches

Provide insights that help optimize productivity without revealing specific work content.`;
  }

  /**
   * Minimal productivity scoring prompt
   */
  static getPrivacyAwareProductivityPrompt() {
    return `Rate productivity (1-10) based on these privacy-safe indicators:

SCORING CRITERIA (No specific content analysis):

## Base Activity Assessment (1-10)
- **9-10**: Clear focus on single complex task
- **7-8**: Organized multi-tasking on work activities  
- **5-6**: Mixed work and non-work activities
- **3-4**: Primarily casual/non-work activities
- **1-2**: Distracted or non-productive state

## Focus Quality Indicators
- Single application use = higher score
- Multiple related applications = moderate score
- Many unrelated applications = lower score
- Clean organization = score bonus

## Work Environment Quality
- Purposeful screen layout = positive indicator
- Professional tools visible = work activity
- Organized windows = focused approach
- Cluttered layout = potential distraction

Provide only the numerical score (1-10) and general productivity level without describing specific content.`;
  }

  /**
   * Generic application usage analysis
   */
  static getPrivacyAwareAppAnalysisPrompt() {
    return `Analyze application usage patterns without revealing specific content:

PRIVACY-SAFE ANALYSIS:
- Identify application TYPES not specific apps
- Focus on usage PATTERNS not content
- Assess productivity INDICATORS not details
- Provide BEHAVIORAL insights not specific activities

Categories to use:
- "Text/Code Editor" instead of specific editor names
- "Web Browser" instead of specific sites
- "Communication Tool" instead of specific platforms
- "Design Software" instead of specific programs

Focus on how the person works, not what they're working on.`;
  }

  /**
   * Research-specific privacy-aware prompt
   */
  static getResearchActivityPrompt() {
    return `Analyze this research activity screenshot with privacy protection:

RESEARCH ANALYSIS (Privacy-Safe):

## 1. RESEARCH TYPE IDENTIFICATION
- **Academic Research**: Scholarly sources, papers, citations
- **Technical Research**: Documentation, APIs, tutorials  
- **Market Research**: Industry information, trends
- **Background Research**: General information gathering
- **Reference Lookup**: Quick fact-checking or definitions

## 2. RESEARCH QUALITY INDICATORS
- **Deep Research**: Multiple sources, detailed analysis
- **Focused Lookup**: Specific question resolution
- **Broad Exploration**: General topic investigation
- **Casual Browsing**: Light information consumption

## 3. RESEARCH WORKFLOW ASSESSMENT
- **Systematic**: Organized approach with note-taking
- **Exploratory**: Open-ended investigation
- **Targeted**: Specific problem-solving research
- **Comparative**: Multiple source evaluation

IMPORTANT: Describe research PATTERNS and APPROACH without revealing:
- Specific topics being researched
- Actual source names or content
- Personal or proprietary information
- Detailed text or document contents

Focus on research methodology and productivity, not subject matter.`;
  }
}

module.exports = PrivacyAwarePrompts;