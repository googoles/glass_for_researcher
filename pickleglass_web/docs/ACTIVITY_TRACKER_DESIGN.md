# Glass Activity Tracker - UI/UX Design System

## Overview

The Glass Activity Tracker is a comprehensive productivity monitoring system that uses screenshot capture and AI summarization to provide users with detailed insights into their work patterns, focus time, and productivity metrics.

## Design Philosophy

### Privacy-First Design
- All data processing happens locally when possible
- Clear privacy controls and data transparency
- Encrypted storage with user control over data retention
- Prominent privacy indicators throughout the interface

### Accessible & Inclusive
- WCAG 2.1 AA compliant color contrasts
- Keyboard navigation support
- Screen reader friendly structure
- Multiple ways to access information

### Performance-Optimized
- Lightweight components with minimal re-renders
- Progressive loading of data
- Efficient state management
- Smooth animations with hardware acceleration

## Color System

### Primary Colors
```css
/* Focus Activities */
--color-focus-50: #eff6ff
--color-focus-500: #3b82f6
--color-focus-700: #1d4ed8

/* Communication Activities */
--color-communication-50: #ecfdf5
--color-communication-500: #10b981
--color-communication-700: #047857

/* Research Activities */
--color-research-50: #f5f3ff
--color-research-500: #8b5cf6
--color-research-700: #6d28d9

/* Break Activities */
--color-break-50: #fffbeb
--color-break-500: #f59e0b
--color-break-700: #b45309

/* Creative Activities */
--color-creative-50: #fdf2f8
--color-creative-500: #ec4899
--color-creative-700: #be185d
```

### Status Colors
```css
/* Success States */
--color-success-500: #10b981
--color-success-700: #047857

/* Warning States */
--color-warning-500: #f59e0b
--color-warning-700: #b45309

/* Error States */
--color-error-500: #ef4444
--color-error-700: #b91c1c
```

## Typography Scale

### Headings
- **Display**: 36px/40px, Weight: 700 - Hero headlines
- **H1**: 30px/36px, Weight: 600 - Page titles
- **H2**: 24px/32px, Weight: 600 - Section headers
- **H3**: 20px/28px, Weight: 600 - Card titles

### Body Text
- **Body**: 16px/24px, Weight: 400 - Default text
- **Small**: 14px/20px, Weight: 400 - Secondary text
- **Tiny**: 12px/16px, Weight: 400 - Captions

## Spacing System

Based on 4px increments for consistent rhythm:
- **Tight**: 4px - Element padding
- **Small**: 8px - Component spacing
- **Medium**: 16px - Section spacing
- **Large**: 24px - Content blocks
- **XL**: 32px - Page sections
- **Hero**: 48px - Major separations

## Component Architecture

### 1. MetricCard
**Purpose**: Display key performance metrics with trends and progress indicators

**Props**:
- `title`: Metric name
- `value`: Primary metric value
- `icon`: Lucide icon component
- `trend`: Optional trend indicator with direction and change value
- `progress`: Optional progress bar configuration

**Usage**:
```tsx
<MetricCard
  title="Focus Score"
  value={85}
  icon={Target}
  iconColor="text-blue-600"
  iconBgColor="bg-blue-50"
  trend={{ direction: 'up', value: '+12%', icon: ArrowUp }}
  progress={{ value: 85, color: 'bg-blue-600' }}
/>
```

### 2. CategoryBadge
**Purpose**: Visual indicator for activity categories with consistent styling

**Props**:
- `category`: Category configuration object
- `count`: Optional activity count
- `size`: Badge size ('sm', 'md', 'lg')
- `onClick`: Optional click handler

**Usage**:
```tsx
<CategoryBadge
  category={ACTIVITY_CATEGORIES.focus}
  count={12}
  size="md"
  onClick={() => filterByCategory('focus')}
/>
```

### 3. ActivityCard
**Purpose**: Individual activity display with metadata and actions

**Props**:
- `id`: Unique activity identifier
- `title`: Activity title
- `timestamp`: Activity start time
- `duration`: Activity duration in seconds
- `category`: Category configuration
- `onDelete`: Delete handler function

**Usage**:
```tsx
<ActivityCard
  id="activity-123"
  title="Design Review Meeting"
  timestamp={1640995200}
  duration={3600}
  category={ACTIVITY_CATEGORIES.communication}
  onDelete={handleDelete}
/>
```

### 4. InsightCard
**Purpose**: AI-generated insights and recommendations with contextual styling

**Props**:
- `title`: Insight title
- `description`: Detailed insight text
- `icon`: Relevant icon
- `type`: Insight type ('info', 'success', 'warning', 'tip')
- `actionLabel`: Optional action button text
- `onAction`: Optional action handler

**Usage**:
```tsx
<InsightCard
  title="Peak Performance"
  description="Your focus peaks between 9-11 AM. Schedule complex tasks during this window."
  icon={TrendingUp}
  type="info"
  actionLabel="Set Focus Block"
  onAction={handleCreateFocusBlock}
/>
```

### 5. PrivacyPanel
**Purpose**: Comprehensive privacy controls and data management interface

**Props**:
- `isExpanded`: Panel expansion state
- `onToggle`: Toggle handler
- `className`: Additional CSS classes

**Features**:
- Privacy setting toggles
- Data export functionality
- Data deletion controls
- Privacy education content

## Layout Patterns

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│ Header (Greeting + View Tabs)                           │
├─────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│ │Metric 1 │ │Metric 2 │ │Metric 3 │ │Metric 4 │         │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘         │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────────────┐ │
│ │  Category Grid      │ │     Recent Activities       │ │
│ │                     │ │                             │ │
│ └─────────────────────┘ └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Timeline Layout
```
┌─────────────────────────────────────────────────────────┐
│ Timeline Header                                         │
├─────────────────────────────────────────────────────────┤
│ Mon   ████████████████░░░░  12 activities              │
│ Tue   ██████████████████    18 activities              │
│ Wed   ███████████░░░░░░░░   15 activities              │
│ Thu   ████████████████░░    16 activities              │
│ Fri   ██████████░░░░░░░░    10 activities              │
│ Sat   ███░░░░░░░░░░░░░░░░    3 activities               │
│ Sun   ██░░░░░░░░░░░░░░░░░    2 activities               │
└─────────────────────────────────────────────────────────┘
```

## Interaction Patterns

### Micro-Interactions
- **Hover States**: Subtle elevation and color shifts
- **Loading States**: Skeleton screens and progress indicators  
- **Focus States**: Clear keyboard focus indicators
- **Success Feedback**: Checkmarks and positive color changes
- **Error States**: Red indicators with helpful messaging

### Navigation Flows
1. **Dashboard → Detail View**: Click activity card
2. **Category Filtering**: Click category badge or use dropdown
3. **Time Range Selection**: Tab-based time period selector
4. **Privacy Controls**: Expandable panel with progressive disclosure

## Responsive Design

### Breakpoints
- **Mobile**: < 640px - Single column layout
- **Tablet**: 640px - 1024px - Two column layout
- **Desktop**: > 1024px - Multi-column layout

### Mobile Adaptations
- **Touch Targets**: Minimum 44px tap targets
- **Simplified Navigation**: Bottom sheet modals
- **Optimized Content**: Condensed metric cards
- **Thumb-Friendly**: Controls within thumb reach

## Accessibility Features

### Screen Reader Support
- Semantic HTML structure
- ARIA labels and descriptions
- Role annotations for interactive elements
- Skip navigation links

### Keyboard Navigation
- Tab order follows visual hierarchy
- Arrow key navigation within components
- Enter/Space activation for buttons
- Escape key for modal dismissal

### Visual Accessibility
- 4.5:1 minimum color contrast
- Focus indicators for all interactive elements
- No color-only information conveyance
- Scalable text up to 200% zoom

## Performance Guidelines

### Component Optimization
- **Memoization**: React.memo for stable components
- **Lazy Loading**: Code splitting for non-critical features
- **Virtual Scrolling**: For large activity lists
- **Debounced Inputs**: Search and filter inputs

### Animation Performance
- **GPU Acceleration**: transform and opacity animations
- **Reduced Motion**: Respect user preference
- **Smooth Transitions**: 60fps target for all animations

## Implementation Checklist

### Development Phase ✅
- [x] Create component library with TypeScript
- [x] Implement design system tokens in Tailwind
- [x] Build responsive layouts
- [x] Add accessibility features
- [x] Create reusable UI components

### Testing Phase 🔄
- [ ] Unit tests for all components
- [ ] Integration tests for user flows
- [ ] Accessibility audit (axe-core)
- [ ] Performance testing (Lighthouse)
- [ ] Cross-browser compatibility

### Deployment Phase 📋
- [ ] Design system documentation
- [ ] Component Storybook
- [ ] Usage guidelines
- [ ] Migration guides
- [ ] Analytics integration

## Future Enhancements

### Planned Features
- **Dark Mode**: Complete dark theme implementation
- **Custom Categories**: User-defined activity categories
- **Goal Setting**: Personal productivity goals and tracking
- **Team Analytics**: Collaborative productivity insights
- **Export Options**: Multiple data export formats

### Advanced Interactions
- **Drag & Drop**: Activity organization and categorization
- **Bulk Actions**: Multi-select operations
- **Real-time Updates**: Live activity tracking
- **Keyboard Shortcuts**: Power user productivity features

---

*This design system ensures the Glass Activity Tracker provides a premium, accessible, and privacy-focused user experience that scales from individual productivity tracking to comprehensive workforce analytics.*