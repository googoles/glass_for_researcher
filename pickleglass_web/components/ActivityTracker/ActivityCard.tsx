'use client'

import Link from 'next/link'
import { LucideIcon, Trash2 } from 'lucide-react'
import CategoryBadge from './CategoryBadge'

interface ActivityCategory {
  icon: LucideIcon
  label: string
  bgColor: string
  textColor: string
}

interface ActivityCardProps {
  id: string
  title: string
  timestamp: number
  duration?: number
  category: ActivityCategory
  summary?: string
  isDeleting?: boolean
  onDelete?: (id: string) => void
  className?: string
}

export default function ActivityCard({
  id,
  title,
  timestamp,
  duration,
  category,
  summary,
  isDeleting = false,
  onDelete,
  className = ''
}: ActivityCardProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleString()
  }

  return (
    <div className={`
      group flex items-center justify-between p-4 bg-gray-50 rounded-lg 
      hover:bg-gray-100 transition-all duration-200 
      ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
      ${className}
    `}>
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div className={`p-2 ${category.bgColor} rounded-lg flex-shrink-0`}>
          <category.icon className={`h-4 w-4 ${category.textColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <Link 
              href={`/activity/details?sessionId=${id}`} 
              className="font-medium text-gray-900 hover:text-blue-600 transition-colors truncate"
            >
              {title}
            </Link>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{formatTimestamp(timestamp)}</span>
            {duration && (
              <>
                <span>•</span>
                <span>{formatDuration(duration)}</span>
              </>
            )}
          </div>
          
          {summary && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{summary}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-3 flex-shrink-0">
        <CategoryBadge category={category} size="sm" />
        
        {onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete(id)
            }}
            disabled={isDeleting}
            className="
              opacity-0 group-hover:opacity-100 p-1 text-gray-400 
              hover:text-red-600 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            title="Delete activity"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}