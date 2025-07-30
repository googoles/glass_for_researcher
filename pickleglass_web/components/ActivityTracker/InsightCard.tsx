'use client'

import { LucideIcon } from 'lucide-react'

interface InsightCardProps {
  title: string
  description: string
  icon: LucideIcon
  type: 'info' | 'success' | 'warning' | 'tip'
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export default function InsightCard({
  title,
  description,
  icon: Icon,
  type,
  actionLabel,
  onAction,
  className = ''
}: InsightCardProps) {
  const typeStyles = {
    info: {
      container: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      textColor: 'text-blue-700',
      buttonStyle: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    },
    success: {
      container: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      textColor: 'text-green-700',
      buttonStyle: 'bg-green-100 text-green-700 hover:bg-green-200'
    },
    warning: {
      container: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-900',
      textColor: 'text-amber-700',
      buttonStyle: 'bg-amber-100 text-amber-700 hover:bg-amber-200'
    },
    tip: {
      container: 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      titleColor: 'text-purple-900',
      textColor: 'text-purple-700',
      buttonStyle: 'bg-purple-100 text-purple-700 hover:bg-purple-200'
    }
  }

  const styles = typeStyles[type]

  return (
    <div className={`p-4 rounded-lg border ${styles.container} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className={`p-2 ${styles.iconBg} rounded-lg mt-1 flex-shrink-0`}>
          <Icon className={`h-4 w-4 ${styles.iconColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${styles.titleColor} mb-1`}>
            {title}
          </h4>
          <p className={`text-sm ${styles.textColor} leading-relaxed`}>
            {description}
          </p>
          
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className={`
                mt-3 px-3 py-1.5 rounded-md text-xs font-medium 
                transition-colors duration-200 ${styles.buttonStyle}
              `}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}