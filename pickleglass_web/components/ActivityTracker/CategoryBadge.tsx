'use client'

import { LucideIcon } from 'lucide-react'

interface CategoryBadgeProps {
  category: {
    icon: LucideIcon
    label: string
    bgColor: string
    textColor: string
  }
  count?: number
  size: 'sm' | 'md' | 'lg'
  onClick?: () => void
  className?: string
}

export default function CategoryBadge({
  category,
  count,
  size = 'md',
  onClick,
  className = ''
}: CategoryBadgeProps) {
  const IconComponent = category.icon
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  }
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <span 
      className={`
        inline-flex items-center space-x-1.5 rounded-full font-medium
        ${category.bgColor} ${category.textColor} ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <IconComponent className={iconSizes[size]} />
      <span>{category.label}</span>
      {count !== undefined && (
        <span className="ml-1 opacity-75">({count})</span>
      )}
    </span>
  )
}