// Activity Tracker Components
export { default as MetricCard } from './MetricCard'
export { default as CategoryBadge } from './CategoryBadge'
export { default as ActivityCard } from './ActivityCard'
export { default as InsightCard } from './InsightCard'
export { default as PrivacyPanel } from './PrivacyPanel'

// Common types and constants
export const ACTIVITY_CATEGORIES = {
  focus: { 
    icon: 'Focus', 
    label: 'Focus Work', 
    color: '#3b82f6', 
    bgColor: 'bg-blue-50', 
    textColor: 'text-blue-700', 
    borderColor: 'border-blue-200' 
  },
  communication: { 
    icon: 'MessageCircle', 
    label: 'Communication', 
    color: '#10b981', 
    bgColor: 'bg-green-50', 
    textColor: 'text-green-700', 
    borderColor: 'border-green-200' 
  },
  research: { 
    icon: 'BookOpen', 
    label: 'Research', 
    color: '#8b5cf6', 
    bgColor: 'bg-purple-50', 
    textColor: 'text-purple-700', 
    borderColor: 'border-purple-200' 
  },
  break: { 
    icon: 'Coffee', 
    label: 'Break', 
    color: '#f59e0b', 
    bgColor: 'bg-amber-50', 
    textColor: 'text-amber-700', 
    borderColor: 'border-amber-200' 
  },
  creative: { 
    icon: 'Zap', 
    label: 'Creative', 
    color: '#ec4899', 
    bgColor: 'bg-pink-50', 
    textColor: 'text-pink-700', 
    borderColor: 'border-pink-200' 
  },
  other: { 
    icon: 'MoreVertical', 
    label: 'Other', 
    color: '#6b7280', 
    bgColor: 'bg-gray-50', 
    textColor: 'text-gray-700', 
    borderColor: 'border-gray-200' 
  }
} as const

export type CategoryKey = keyof typeof ACTIVITY_CATEGORIES