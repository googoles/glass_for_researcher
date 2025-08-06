# Advanced AI Analysis System for Activity Tracking

This directory contains the sophisticated AI analysis system that provides detailed insights into user productivity patterns and work behaviors.

## Core Components

### 1. Gemini Analysis Service (`analysisService.js`)
The central orchestrator that coordinates all AI analysis operations using Gemini:

- **Screenshot Analysis**: Processes screenshots using advanced Gemini prompts to identify activity types, productivity levels, and focus quality
- **Pattern Recognition**: Analyzes sequences of screenshots to identify behavioral patterns and trends
- **Productivity Scoring**: Generates detailed productivity scores with comprehensive breakdowns
- **Insight Generation**: Creates personalized recommendations based on analysis history
- **Application Analysis**: Provides specialized analysis for specific applications and tools

Key Features:
- Multi-modal AI analysis using Gemini's vision capabilities
- Intelligent caching system for improved performance
- Confidence scoring for analysis reliability
- Contextual enhancement based on system state

### 2. Activity Prompts (`activityPrompts.js`)
Sophisticated prompt templates for different types of analysis:

- **Master Screenshot Analysis**: Comprehensive framework analyzing application context, work type, productivity assessment, focus quality, visual cues, temporal context, and personalization markers
- **Pattern Analysis**: Specialized prompts for identifying workflow patterns, focus sessions, and productivity rhythms
- **Contextual Analysis**: Domain-specific analysis for coding, writing, research, design, and general work
- **Temporal Analysis**: Understanding circadian productivity patterns and optimal timing
- **Distraction Analysis**: Identifying focus quality issues and distraction sources
- **Productivity Scoring**: Algorithmic framework for consistent productivity assessment

### 3. Pattern Recognizer (`patternRecognizer.js`)
Computational analysis system that identifies behavioral patterns:

- **Focus Pattern Analysis**: Identifies focus sessions, duration, and quality
- **Task Switching Analysis**: Analyzes context switching patterns and efficiency
- **Productivity Rhythms**: Maps productivity variations throughout time periods
- **Application Usage Patterns**: Tracks application usage efficiency and patterns
- **Temporal Patterns**: Identifies time-of-day and day-of-week effects
- **Distraction Pattern Analysis**: Detects distraction sources and recovery patterns
- **Workflow Pattern Recognition**: Identifies recurring work sequences and efficiency

### 4. Productivity Scorer (`productivityScorer.js`)
Sophisticated scoring algorithm that combines multiple factors:

- **Application-based Scoring**: Rates productivity based on applications in use
- **Visual Complexity Analysis**: Assesses screen content for productivity indicators
- **Temporal Factors**: Applies time-of-day and circadian rhythm modifiers
- **Behavioral Analysis**: Incorporates keyboard/mouse activity patterns
- **Contextual Factors**: Considers project context, meetings, and environment

Scoring Components:
- Base productivity score (0-40 points)
- Focus quality multiplier (0.5x - 1.5x)
- Complexity bonus (0-20 points)
- Efficiency indicators (0-15 points)
- Deduction factors (-5 to -30 points)

### 5. Insight Generator (`insightGenerator.js`)
AI-powered system for generating personalized insights and recommendations:

- **Overview Insights**: High-level productivity summaries and trends
- **Productivity Analysis**: Detailed trend analysis and improvement opportunities
- **Focus Insights**: Deep analysis of focus patterns and distraction sources
- **Application Insights**: Usage optimization and tool efficiency recommendations
- **Temporal Insights**: Optimal scheduling and circadian rhythm analysis
- **Behavioral Insights**: Work style identification and habit pattern analysis

## Integration with Research Service

The AI system is seamlessly integrated with the existing research tracking service:

### Enhanced Research Service Features:
- **Automatic Analysis**: Screenshots are captured and analyzed every minute during tracking
- **Real-time Scoring**: Current productivity scores are continuously updated
- **Pattern Detection**: Long-term patterns are identified and cached
- **Insight Generation**: Personalized recommendations are generated based on historical data

### Database Integration:
- **Analysis Storage**: All AI analysis results are stored with session correlation
- **Insight Caching**: Generated insights are cached to improve performance
- **Historical Analysis**: Complete analysis history is maintained for trend analysis

### API Endpoints:
- `/api/research/analysis/current-score` - Get current productivity score
- `/api/research/analysis/history` - Retrieve analysis history
- `/api/research/insights/{timeframe}` - Generate insights for specific timeframes
- `/api/research/analysis/productivity-stats/{timeframe}` - Get productivity statistics
- `/api/research/analysis/app-usage/{appName}` - Analyze specific application usage
- `/api/research/analysis/manual-capture` - Trigger manual analysis
- `/api/research/ai-status` - Get AI analysis system status

## AI Dashboard

A comprehensive React-based dashboard (`/research/ai-dashboard`) provides:

- **Real-time Monitoring**: Current productivity scores and AI status
- **Historical Analysis**: Detailed analysis history with trends
- **Pattern Visualization**: Visual representation of productivity patterns
- **Personalized Insights**: AI-generated recommendations and optimizations
- **Manual Controls**: Ability to trigger analysis and adjust timeframes

## Technical Requirements

### AI Provider Support:
- **Gemini**: Primary provider for multimodal analysis (recommended)
- **OpenAI**: Alternative provider with GPT-4o vision capabilities
- **Fallback**: Computational analysis when AI providers are unavailable

### Performance Optimizations:
- **Intelligent Caching**: Analysis results cached to reduce API costs
- **Batch Processing**: Multiple screenshots processed efficiently
- **Background Processing**: Analysis runs without impacting user experience
- **Memory Management**: Screenshot history limited to prevent memory issues

### Privacy and Security:
- **Local Processing**: Screenshots processed locally before AI analysis
- **No Image Storage**: Only analysis results stored, not raw screenshots
- **User Control**: Users can disable AI analysis while maintaining basic tracking
- **Encrypted Storage**: Analysis data encrypted using existing encryption service

## Configuration

The AI analysis system automatically initializes when:
1. Valid API keys are configured in settings (Gemini or OpenAI)
2. Research tracking is enabled
3. Sufficient system permissions are available

Users can:
- Enable/disable AI analysis independently of basic tracking
- Choose between AI providers based on preference
- Adjust analysis frequency and caching settings
- Set productivity goals and preferences for personalized insights

## Future Enhancements

Planned improvements include:
- Machine learning model training on user-specific patterns
- Integration with calendar and task management systems
- Advanced visualization and reporting features
- Team collaboration and benchmarking capabilities
- Mobile companion app for insights on-the-go