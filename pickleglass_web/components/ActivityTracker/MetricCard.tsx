'use client'

import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor: string
  iconBgColor: string
  trend?: {
    direction: 'up' | 'down' | 'stable'
    value: string
    icon: LucideIcon
  }
  subtitle?: string
  progress?: {
    value: number
    color: string
  }
  className?: string
  children?: ReactNode
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
  trend,
  subtitle,
  progress,
  className = '',
  children
}: MetricCardProps) {
  const getTrendColor = () => {
    switch (trend?.direction) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className={`bg-white rounded-xl p-6 border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${iconBgColor} rounded-lg`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
            <trend.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{trend.value}</span>
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
      
      {subtitle && (
        <p className="text-xs text-gray-500 mb-2">{subtitle}</p>
      )}
      
      {progress && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${progress.color}`}
            style={{ width: `${Math.min(100, progress.value)}%` }}
          />
        </div>
      )}
      
      {children}
    </div>
  )
}