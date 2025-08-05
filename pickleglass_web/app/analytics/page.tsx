'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRedirectIfNotAuth } from '@/utils/auth'
import { UserProfile, apiCall, getSessions } from '@/utils/api'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Activity,
  Brain,
  Calendar,
  PieChart,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  Award,
  Zap,
  Focus,
  Users,
  BookOpen,
  Coffee,
  MessageCircle
} from 'lucide-react'

interface AnalyticsData {
  totalActivities: number
  totalTime: number
  averageProductivity: number
  mostProductiveTime: string
  categoryBreakdown: Record<string, number>
  weeklyTrend: 'up' | 'down' | 'stable'
  dailyStats: Array<{
    date: string
    activities: number
    productivity: number
    focusTime: number
  }>
  achievements: Array<{
    title: string
    description: string
    earned: boolean
    progress?: number
  }>
}

const ACTIVITY_CATEGORIES = {
  focus: { label: 'Focus Work', color: 'blue', icon: Focus },
  communication: { label: 'Communication', color: 'green', icon: MessageCircle },
  research: { label: 'Research', color: 'purple', icon: BookOpen },
  break: { label: 'Break', color: 'orange', icon: Coffee },
  creative: { label: 'Creative', color: 'pink', icon: Zap },
  other: { label: 'Other', color: 'gray', icon: Activity }
}

export default function AnalyticsPage() {
  const userInfo = useRedirectIfNotAuth() as UserProfile | null
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week')
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalyticsData = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null)
      
      // Fetch sessions with server-side filtering for better performance
      const sessionsResponse = await getSessions({ timeRange, limit: 100 })
      // Ensure sessions is always an array
      const sessions = Array.isArray(sessionsResponse) ? sessionsResponse : []
      
      // Fetch productivity stats if available
      let productivityStats = null
      try {
        const response = await apiCall(`/api/research/analysis/productivity-stats/${timeRange}`, {
          signal
        })
        if (response.ok) {
          productivityStats = await response.json()
        }
      } catch (error) {
        console.error('Failed to fetch productivity stats:', error)
        // Continue without productivity stats rather than failing entirely
      }

      // Sessions are already filtered by backend, no need to filter again
      // This improves performance significantly
      const filteredSessions = sessions

      const totalActivities = filteredSessions.length
      const totalTime = filteredSessions.reduce((sum, session) => {
        const duration = session.ended_at 
          ? session.ended_at - session.started_at
          : Math.max(0, Math.floor(Date.now() / 1000) - session.started_at)
        return sum + duration
      }, 0)

      // Mock category breakdown (in real app, this would come from AI categorization)
      const categoryBreakdown = {
        focus: Math.floor(totalActivities * 0.4),
        communication: Math.floor(totalActivities * 0.25),
        research: Math.floor(totalActivities * 0.2),
        break: Math.floor(totalActivities * 0.1),
        creative: Math.floor(totalActivities * 0.05)
      }

      // Generate daily stats more efficiently
      const now = new Date()
      const daysToShow = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90
      const dailyStats = []
      
      // Pre-group sessions by date for better performance
      const sessionsByDate = new Map()
      filteredSessions.forEach(session => {
        const sessionDate = new Date(session.started_at * 1000)
        const dateKey = sessionDate.toISOString().split('T')[0]
        if (!sessionsByDate.has(dateKey)) {
          sessionsByDate.set(dateKey, 0)
        }
        sessionsByDate.set(dateKey, sessionsByDate.get(dateKey) + 1)
      })
      
      // Generate stats for recent days only
      for (let i = Math.min(daysToShow - 1, 6); i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateKey = date.toISOString().split('T')[0]
        const dayActivities = sessionsByDate.get(dateKey) || 0

        dailyStats.push({
          date: dateKey,
          activities: dayActivities,
          productivity: Math.floor(Math.random() * 30) + 70, // Mock productivity score
          focusTime: Math.floor(Math.random() * 4) + 2 // Mock focus time in hours
        })
      }

      // Mock achievements
      const achievements = [
        {
          title: 'Focus Master',
          description: 'Maintained focus for 4+ hours in a day',
          earned: totalTime > 14400, // 4 hours
          progress: Math.min(100, (totalTime / 14400) * 100)
        },
        {
          title: 'Consistency Champion',
          description: 'Active for 7 consecutive days',
          earned: dailyStats.filter(day => day.activities > 0).length >= 7,
          progress: (dailyStats.filter(day => day.activities > 0).length / 7) * 100
        },
        {
          title: 'Productivity Pro',
          description: 'Average productivity score above 85',
          earned: false,
          progress: 73
        }
      ]

      const analytics: AnalyticsData = {
        totalActivities,
        totalTime,
        averageProductivity: productivityStats?.averageScore || 78,
        mostProductiveTime: productivityStats?.peakHours || '10:00 AM',
        categoryBreakdown,
        weeklyTrend: totalActivities > 20 ? 'up' : totalActivities < 10 ? 'down' : 'stable',
        dailyStats,
        achievements
      }

      setAnalyticsData(analytics)
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to fetch analytics data:', error)
        setError('Failed to load analytics data. Please try again.')
      }
    }
  }, [timeRange])

  const refreshData = useCallback(async () => {
    setRefreshing(true)
    await fetchAnalyticsData()
    setRefreshing(false)
  }, [fetchAnalyticsData])

  useEffect(() => {
    const abortController = new AbortController()
    
    const loadData = async () => {
      setIsLoading(true)
      try {
        await fetchAnalyticsData(abortController.signal)
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }
    
    loadData()
    
    return () => {
      abortController.abort()
    }
  }, [fetchAnalyticsData])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  if (!userInfo || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 p-4 bg-red-50 rounded-lg">
            <p className="text-red-600 mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No analytics data available</p>
        </div>
      </div>
    )
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {getGreeting()}, {userInfo.display_name}
              </h1>
              <p className="text-gray-600">Your productivity analytics and insights</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter')}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
              </select>
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                <p className="text-2xl font-semibold text-gray-900">{analyticsData.totalActivities}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {getTrendIcon(analyticsData.weeklyTrend)}
              <span className="text-sm text-gray-600 ml-1">vs last period</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Time</p>
                <p className="text-2xl font-semibold text-gray-900">{formatDuration(analyticsData.totalTime)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <ArrowUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-600 ml-1">+12% this {timeRange}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Productivity</p>
                <p className="text-2xl font-semibold text-gray-900">{analyticsData.averageProductivity}%</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <ArrowUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-600 ml-1">Above average</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Peak Hours</p>
                <p className="text-2xl font-semibold text-gray-900">{analyticsData.mostProductiveTime}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <Brain className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-gray-600 ml-1">Most productive</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily Activity Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Daily Activity</h3>
              <BarChart3 className="h-5 w-5 text-gray-600" />
            </div>
            <div className="space-y-4">
              {Array.isArray(analyticsData.dailyStats) && analyticsData.dailyStats.map((day, index) => {
                const maxActivities = Math.max(...(Array.isArray(analyticsData.dailyStats) ? analyticsData.dailyStats : []).map(d => d.activities))
                const width = maxActivities > 0 ? (day.activities / maxActivities) * 100 : 0
                return (
                  <div key={day.date} className="flex items-center space-x-4">
                    <div className="w-12 text-sm text-gray-600">
                      {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                          <div 
                            className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${Math.max(width, 5)}%` }}
                          >
                            {day.activities > 0 && (
                              <span className="text-xs text-white font-medium">{day.activities}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 w-16">
                          {day.productivity}%
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Activity Categories</h3>
              <PieChart className="h-5 w-5 text-gray-600" />
            </div>
            <div className="space-y-4">
              {Object.entries(analyticsData.categoryBreakdown || {}).map(([key, count]) => {
                const category = ACTIVITY_CATEGORIES[key as keyof typeof ACTIVITY_CATEGORIES]
                const IconComponent = category.icon
                const total = Object.values(analyticsData.categoryBreakdown).reduce((sum, val) => sum + val, 0)
                const percentage = total > 0 ? (count / total) * 100 : 0

                return (
                  <div key={key} className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg bg-${category.color}-50`}>
                      <IconComponent className={`h-4 w-4 text-${category.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{category.label}</span>
                        <span className="text-sm text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`bg-${category.color}-500 h-2 rounded-full`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
              <p className="text-sm text-gray-600">Track your productivity milestones</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.isArray(analyticsData.achievements) && analyticsData.achievements.map((achievement, index) => (
              <div key={index} className={`p-4 rounded-lg border-2 transition-all ${
                achievement.earned 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-full ${
                    achievement.earned ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Award className={`h-5 w-5 ${
                      achievement.earned ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h4 className={`font-medium ${
                      achievement.earned ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      {achievement.title}
                    </h4>
                    <p className={`text-sm ${
                      achievement.earned ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {achievement.description}
                    </p>
                  </div>
                </div>
                
                {!achievement.earned && achievement.progress !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="text-gray-900 font-medium">{Math.round(achievement.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}