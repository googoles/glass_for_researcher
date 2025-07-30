# Sub-Agents Usage Guide for Glass Development

This guide explains how to effectively use the sub-agents in your `.claude/agents` directory for the Glass project.

## What Are Sub-Agents?

Sub-agents are specialized AI assistants that Claude Code can invoke to handle specific tasks. Each sub-agent:
- Has deep expertise in a particular domain
- Operates in its own clean context window
- Has access to specific tools needed for its tasks
- Follows a detailed system prompt defining its behavior

## How Sub-Agents Work

### 1. **Automatic Invocation**
Claude Code automatically selects appropriate sub-agents based on:
- Your task description
- The sub-agent's configured description and examples
- The current context and required tools

### 2. **Explicit Invocation**
You can directly request a specific sub-agent:
```
"Use the rapid-prototyper agent to create a new research dashboard"
"Have the test-writer-fixer agent ensure all tests pass"
```

### 3. **Task Tool Invocation**
Sub-agents are invoked using the Task tool with this pattern:
```javascript
Task(
  description="Brief task description",
  prompt="Detailed instructions for the sub-agent",
  subagent_type="agent-name"
)
```

## Available Sub-Agents for Glass

### 🛠️ Engineering Agents

#### **rapid-prototyper**
Perfect for Glass feature development:
```
"Create a new visualization mode for Glass that shows user activity as a heatmap"
"Build a prototype integration with Notion for Glass"
```

#### **test-writer-fixer** 
Essential after Glass code changes:
```
"Run tests after updating the research tracking module"
"Fix failing tests in the listen service"
```

#### **backend-architect**
For Glass API and service design:
```
"Design the API structure for Glass's new collaboration features"
"Optimize the SQLite schema for better performance"
```

#### **frontend-developer**
For Glass UI improvements:
```
"Implement a new settings panel for research mode configuration"
"Create responsive UI components for the Glass dashboard"
```

### 📊 Product Agents

#### **feedback-synthesizer**
Analyze Glass user feedback:
```
"Analyze user feedback about Glass's screen capture feature"
"What are users saying about the research tracking mode?"
```

#### **trend-researcher**
Find opportunities for Glass:
```
"What productivity trends could Glass capitalize on?"
"Research competing screen capture and AI assistant tools"
```

### 🎨 Design Agents

#### **ui-designer**
Improve Glass's interface:
```
"Design a better onboarding flow for Glass"
"Create mockups for the research dashboard"
```

#### **ux-researcher**
Understand Glass users:
```
"How do users interact with Glass's listen mode?"
"What workflows do researchers follow when using Glass?"
```

### 🧪 Testing Agents

#### **api-tester**
Test Glass's IPC and web APIs:
```
"Test all research API endpoints for proper error handling"
"Verify IPC communication between renderer and main process"
```

#### **performance-benchmarker**
Optimize Glass performance:
```
"Benchmark Glass's memory usage during long sessions"
"Test screen capture performance with different quality settings"
```

## Best Practices for Glass Development

### 1. **Proactive Sub-Agent Usage**

These agents should be triggered automatically:

- **test-writer-fixer**: After any code changes
  ```
  After: "I've updated the authentication logic"
  Action: "Now let me run the test-writer-fixer agent"
  ```

- **whimsy-injector**: After UI changes
  ```
  After: "I've redesigned the settings panel"
  Action: "Let's have the whimsy-injector add some delight"
  ```

### 2. **Multi-Agent Workflows**

Complex Glass features benefit from multiple agents:

```
1. trend-researcher: "Find AI assistant trends"
2. rapid-prototyper: "Build prototype based on trends"
3. ui-designer: "Polish the UI"
4. test-writer-fixer: "Ensure comprehensive test coverage"
```

### 3. **Context-Specific Usage**

Match agents to Glass's architecture:

- **For Electron Main Process**: backend-architect, api-tester
- **For Renderer/UI**: frontend-developer, ui-designer
- **For Web App**: rapid-prototyper, frontend-developer
- **For Database**: backend-architect, performance-benchmarker

## Example Scenarios

### Scenario 1: Adding New Feature to Glass

```
User: "Add a feature to Glass that tracks reading time for PDFs"

Claude: "I'll help you add PDF reading time tracking. Let me use the rapid-prototyper agent to quickly build this feature."

Task(
  description="Build PDF tracking feature",
  prompt="Create a PDF reading time tracking feature for Glass that:
  1. Detects when users open PDFs
  2. Tracks time spent reading
  3. Stores data in SQLite
  4. Shows statistics in the UI
  Use the existing Glass architecture with Electron IPC",
  subagent_type="rapid-prototyper"
)
```

### Scenario 2: Fixing Test Failures

```
User: "I updated the listen service but now tests are failing"

Claude: "I see you've updated the listen service. Let me use the test-writer-fixer agent to run the tests and fix any failures."

Task(
  description="Fix listen service tests",
  prompt="The listen service was recently updated. Please:
  1. Run all tests in src/features/listen/
  2. Identify which tests are failing
  3. Fix the failing tests while preserving test intent
  4. Ensure test coverage remains comprehensive",
  subagent_type="test-writer-fixer"
)
```

### Scenario 3: Performance Optimization

```
User: "Glass is using too much memory during long sessions"

Claude: "Let's analyze and optimize Glass's memory usage. I'll use the performance-benchmarker agent."

Task(
  description="Benchmark Glass memory usage",
  prompt="Analyze Glass's memory consumption:
  1. Profile memory usage during typical user sessions
  2. Identify memory leaks in Electron processes
  3. Test with research mode enabled/disabled
  4. Provide optimization recommendations
  Focus on screen capture and audio processing",
  subagent_type="performance-benchmarker"
)
```

### Scenario 4: UI/UX Improvement

```
User: "The research dashboard needs better visual design"

Claude: "I'll help improve the research dashboard design. Let me use the ui-designer agent."

Task(
  description="Redesign research dashboard",
  prompt="Redesign Glass's research dashboard UI:
  1. Review current implementation in src/ui/research/
  2. Create improved design following Glass's visual style
  3. Focus on data visualization and usability
  4. Ensure consistency with existing Glass UI components
  Consider both Electron and web interfaces",
  subagent_type="ui-designer"
)
```

## Advanced Tips

### 1. **Chain Multiple Agents**
```javascript
// First: Research the problem
await Task(
  description="Research productivity tools",
  prompt="Research current productivity tool trends",
  subagent_type="trend-researcher"
)

// Then: Build based on findings
await Task(
  description="Build feature prototype",
  prompt="Build feature based on research findings",
  subagent_type="rapid-prototyper"
)
```

### 2. **Provide Glass-Specific Context**
Always mention Glass-specific details:
- "Use Electron IPC for communication"
- "Store data in Glass's SQLite database"
- "Follow Glass's existing UI patterns"
- "Compatible with both local and Firebase modes"

### 3. **Leverage Agent Expertise**
Each agent has specific strengths:
- `backend-architect`: Database schema, API design
- `frontend-developer`: React components, Electron renderer
- `devops-automator`: Build processes, deployment
- `test-writer-fixer`: Jest tests, Electron testing

## Creating Custom Glass Sub-Agents

To create a Glass-specific sub-agent:

1. Create a new file in `.claude/agents/custom/`:
```yaml
---
name: glass-specialist
description: Specialized in Glass architecture and patterns
color: blue
tools: Read, Write, MultiEdit, Bash, Grep
---

You are a Glass application specialist...
```

2. Include Glass-specific knowledge:
- Electron main/renderer architecture
- IPC communication patterns
- SQLite and Firebase dual-mode
- Research tracking integration
- Audio and screen capture systems

3. Add relevant examples from Glass codebase

## Troubleshooting

### Sub-Agent Not Triggering
- Make description more specific to Glass
- Use explicit invocation: "Use the X agent to..."
- Ensure agent file is in correct location

### Sub-Agent Missing Context
- Provide Glass-specific details in prompt
- Reference specific files/modules
- Explain Glass's architecture briefly

### Performance Issues
- Sub-agents start with clean context
- Provide focused, specific tasks
- Use appropriate agent for task size

## Summary

Sub-agents are powerful tools for Glass development:
- **Automatic**: They trigger when appropriate
- **Specialized**: Each has deep domain expertise
- **Efficient**: Handle complex tasks independently
- **Collaborative**: Work together for best results

Use them proactively to maintain code quality, accelerate development, and ensure Glass remains a polished, professional application.