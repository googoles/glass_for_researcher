'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRedirectIfNotAuth } from '@/utils/auth'
import {
  UserProfile,
  Session,
  getSessions,
  deleteSession,
  apiCall
} from '@/utils/api'
import { 
  Calendar, 
  Clock, 
  BarChart3, 
  Filter, 
  Search, 
  TrendingUp, 
  Focus, 
  MessageCircle, 
  BookOpen, 
  Coffee, 
  Zap,
  Eye,
  Shield,
  ChevronDown,
  MoreVertical,
  Trash2,
  Play,
  Pause,
  Activity,
  Brain,
  Target,
  Lightbulb,
  Camera,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Timer,
  Sparkles
} from 'lucide-react'

// Activity categories with icons and colors
const ACTIVITY_CATEGORIES = {
  focus: { icon: Focus, label: 'Focus Work', color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  communication: { icon: MessageCircle, label: 'Communication', color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
  research: { icon: BookOpen, label: 'Research', color: 'purple', bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200' },
  break: { icon: Coffee, label: 'Break', color: 'amber', bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
  creative: { icon: Zap, label: 'Creative', color: 'pink', bgColor: 'bg-pink-50', textColor: 'text-pink-700', borderColor: 'border-pink-200' },
  other: { icon: MoreVertical, label: 'Other', color: 'gray', bgColor: 'bg-gray-50', textColor: 'text-gray-700', borderColor: 'border-gray-200' }
} as const

type ViewMode = 'dashboard' | 'timeline' | 'insights'
type CategoryKey = keyof typeof ACTIVITY_CATEGORIES

interface ActivityMetrics {
  totalSessions: number
  totalTime: number
  avgSessionLength: number
  categoryCounts: Record<CategoryKey, number>
  dailyActivities: Array<{ date: string; count: number; categories: Record<CategoryKey, number> }>
}

interface TrackingStatus {
  isTracking: boolean
  currentActivity: {
    title: string
    category: string
    startTime: number
    duration: number
  } | null
  lastAnalysis: {
    category: string
    confidence: number
    timestamp: number
    productivity: number
  } | null
  captureInterval: number
  nextCaptureIn: number | null
}

interface ProductivityScore {
  score: number
  timestamp: number
  confidence: number
  analysis: string
}

interface InsightData {
  insights: Array<{
    type: string
    title: string
    description: string
    importance: 'high' | 'medium' | 'low'
  }>
  recommendations: Array<{
    title: string
    description: string
    category: string
  }>
  trends: {
    productivity: 'improving' | 'declining' | 'stable'
    focus: 'improving' | 'declining' | 'stable'
  }
}

export default function ActivityPage() {
  const userInfo = useRedirectIfNotAuth() as UserProfile | null;
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showPrivacyPanel, setShowPrivacyPanel] = useState(false)
  
  // Enhanced state for real-time tracking
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus | null>(null)
  const [productivityScore, setProductivityScore] = useState<ProductivityScore | null>(null)
  const [insights, setInsights] = useState<InsightData | null>(null)
  const [isLoadingTracking, setIsLoadingTracking] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now())
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchSessions = async () => {
    try {
      const fetchedSessions = await getSessions();
      setSessions(fetchedSessions);
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTrackingStatus = useCallback(async () => {
    try {
      const response = await apiCall('/api/activity/current')
      if (response.ok) {
        const status = await response.json()
        setTrackingStatus(status)
      }
    } catch (error) {
      console.error('Failed to fetch tracking status:', error)
    }
  }, [])

  const fetchProductivityScore = useCallback(async () => {
    try {
      const response = await apiCall('/api/research/analysis/current-score')
      if (response.ok) {
        const score = await response.json()
        setProductivityScore(score)
      }
    } catch (error) {
      console.error('Failed to fetch productivity score:', error)
    }
  }, [])

  const fetchInsights = useCallback(async () => {
    try {
      const response = await apiCall('/api/activity/insights?timeframe=week')
      if (response.ok) {
        const insightData = await response.json()
        setInsights(insightData)
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error)
    }
  }, [])

  const startTracking = async () => {
    setIsLoadingTracking(true)
    try {
      const response = await apiCall('/api/activity/tracking/start', { method: 'POST' })
      if (response.ok) {
        await fetchTrackingStatus()
      }
    } catch (error) {
      console.error('Failed to start tracking:', error)
    } finally {
      setIsLoadingTracking(false)
    }
  }

  const stopTracking = async () => {
    setIsLoadingTracking(true)
    try {
      const response = await apiCall('/api/activity/tracking/stop', { method: 'POST' })
      if (response.ok) {
        await fetchTrackingStatus()
      }
    } catch (error) {
      console.error('Failed to stop tracking:', error)
    } finally {
      setIsLoadingTracking(false)
    }
  }

  const triggerManualCapture = async () => {
    try {
      const response = await apiCall('/api/activity/capture', { method: 'POST' })
      if (response.ok) {
        await fetchProductivityScore()
        setLastRefresh(Date.now())
      }
    } catch (error) {
      console.error('Failed to trigger manual capture:', error)
    }
  }

  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchTrackingStatus(),
      fetchProductivityScore(),
      fetchInsights()
    ])
    setLastRefresh(Date.now())
  }, [fetchTrackingStatus, fetchProductivityScore, fetchInsights])

  useEffect(() => {
    fetchSessions()
    refreshData()
  }, [])

  // Auto-refresh data every 30 seconds when tracking is active
  useEffect(() => {
    if (!autoRefresh || !trackingStatus?.isTracking) return
    
    const interval = setInterval(refreshData, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, trackingStatus?.isTracking, refreshData])

  // Mock function to categorize sessions - in real implementation, this would use AI
  const categorizeSession = (session: Session): CategoryKey => {
    const title = session.title?.toLowerCase() || ''
    if (title.includes('meeting') || title.includes('call') || title.includes('chat')) return 'communication'
    if (title.includes('research') || title.includes('study')) return 'research'
    if (title.includes('break') || title.includes('lunch')) return 'break'
    if (title.includes('design') || title.includes('creative')) return 'creative'
    if (title.includes('focus') || title.includes('work')) return 'focus'
    return 'other'
  }

  // Calculate activity metrics
  const calculateMetrics = (): ActivityMetrics => {
    const totalSessions = sessions.length
    const totalTime = sessions.reduce((acc, session) => {
      const duration = session.ended_at ? (session.ended_at - session.started_at) : 0
      return acc + duration
    }, 0)
    const avgSessionLength = totalSessions > 0 ? totalTime / totalSessions : 0

    const categoryCounts = sessions.reduce((acc, session) => {
      const category = categorizeSession(session)
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<CategoryKey, number>)

    // Group by day
    const dailyActivities = sessions.reduce((acc, session) => {
      const date = new Date(session.started_at * 1000).toDateString()
      const category = categorizeSession(session)
      
      const existing = acc.find(d => d.date === date)
      if (existing) {
        existing.count++
        existing.categories[category] = (existing.categories[category] || 0) + 1
      } else {
        acc.push({ 
          date, 
          count: 1, 
          categories: { [category]: 1 } as Record<CategoryKey, number>
        })
      }
      return acc
    }, [] as Array<{ date: string; count: number; categories: Record<CategoryKey, number> }>)

    return { totalSessions, totalTime, avgSessionLength, categoryCounts, dailyActivities }
  }

  const metrics = calculateMetrics()
  
  // Filter sessions based on selected category and search
  const filteredSessions = sessions.filter(session => {
    const matchesCategory = selectedCategory === 'all' || categorizeSession(session) === selectedCategory
    const matchesSearch = searchQuery === '' || 
      session.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.session_type?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const handleDelete = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this activity? This cannot be undone.')) return;
    setDeletingId(sessionId);
    try {
      await deleteSession(sessionId);
      setSessions(sessions => sessions.filter(s => s.id !== sessionId));
    } catch (error) {
      alert('Failed to delete activity.');
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  }

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* AI-Powered Tracking Control Panel */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Activity Tracking</h2>
              <p className="text-sm text-gray-600">Real-time productivity analysis with Gemini AI</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshData}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <div className={`w-2 h-2 rounded-full ${
                trackingStatus?.isTracking ? 'bg-green-400 animate-pulse' : 'bg-gray-300'
              }`} />
              <span>{trackingStatus?.isTracking ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tracking Controls */}
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Tracking Control</h3>
              <Activity className="h-4 w-4 text-gray-600" />
            </div>
            <div className="space-y-3">
              <button
                onClick={trackingStatus?.isTracking ? stopTracking : startTracking}
                disabled={isLoadingTracking}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  trackingStatus?.isTracking
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoadingTracking ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : trackingStatus?.isTracking ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span>
                  {isLoadingTracking ? 'Processing...' : 
                   trackingStatus?.isTracking ? 'Stop Tracking' : 'Start Tracking'}
                </span>
              </button>
              
              {trackingStatus?.isTracking && (
                <button
                  onClick={triggerManualCapture}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  <span>Capture Now</span>
                </button>
              )}
            </div>
            
            {trackingStatus?.currentActivity && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Timer className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Current Activity</span>
                </div>
                <p className="text-sm text-blue-800">{trackingStatus.currentActivity.title}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {formatDuration((Date.now() - trackingStatus.currentActivity.startTime) / 1000)}
                </p>
              </div>
            )}
          </div>

          {/* Real-time Productivity Score */}
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Productivity Score</h3>
              <Target className="h-4 w-4 text-gray-600" />
            </div>
            {productivityScore ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-2xl font-bold text-gray-900">
                        {productivityScore.score}
                      </span>
                      <span className="text-sm text-gray-500">/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          productivityScore.score >= 8 ? 'bg-green-500' :
                          productivityScore.score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(productivityScore.score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg ${
                    productivityScore.score >= 8 ? 'bg-green-100' :
                    productivityScore.score >= 6 ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <Sparkles className={`h-4 w-4 ${
                      productivityScore.score >= 8 ? 'text-green-600' :
                      productivityScore.score >= 6 ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Analysis: {productivityScore.analysis}
                </div>
                <div className="text-xs text-gray-400">
                  Updated {new Date(productivityScore.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-gray-400 text-sm">Start tracking to see your productivity score</div>
              </div>
            )}
          </div>

          {/* AI Insights Preview */}
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">AI Insights</h3>
              <Lightbulb className="h-4 w-4 text-gray-600" />
            </div>
            {insights?.insights && insights.insights.length > 0 ? (
              <div className="space-y-3">
                {insights.insights.slice(0, 2).map((insight, index) => (
                  <div key={index} className={`p-3 rounded-lg border-l-4 ${
                    insight.importance === 'high' ? 'bg-red-50 border-red-400' :
                    insight.importance === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                    'bg-blue-50 border-blue-400'
                  }`}>
                    <h4 className="text-sm font-medium text-gray-900">{insight.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                  </div>
                ))}
                {insights.insights.length > 2 && (
                  <button
                    onClick={() => setViewMode('insights')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View {insights.insights.length - 2} more insights →
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-gray-400 text-sm">Insights will appear as you use the system</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.totalSessions}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Time</p>
              <p className="text-2xl font-semibold text-gray-900">{formatDuration(metrics.totalTime)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Session</p>
              <p className="text-2xl font-semibold text-gray-900">{formatDuration(metrics.avgSessionLength)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Privacy Status</p>
              <p className="text-sm font-medium text-green-600">Protected</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(ACTIVITY_CATEGORIES).map(([key, category]) => {
            const count = metrics.categoryCounts[key as CategoryKey] || 0
            const percentage = metrics.totalSessions > 0 ? (count / metrics.totalSessions * 100).toFixed(1) : '0'
            const IconComponent = category.icon
            
            return (
              <div key={key} className={`${category.bgColor} ${category.borderColor} border rounded-lg p-4 text-center cursor-pointer transition-all hover:shadow-md`}
                   onClick={() => setSelectedCategory(key as CategoryKey)}>
                <IconComponent className={`h-6 w-6 ${category.textColor} mx-auto mb-2`} />
                <p className="text-sm font-medium text-gray-900">{count}</p>
                <p className="text-xs text-gray-600">{category.label}</p>
                <p className="text-xs text-gray-500">{percentage}%</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as CategoryKey | 'all')}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {Object.entries(ACTIVITY_CATEGORIES).map(([key, category]) => (
                  <option key={key} value={key}>{category.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading activities...</p>
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="space-y-3">
              {filteredSessions.slice(0, 10).map((session) => {
                const category = ACTIVITY_CATEGORIES[categorizeSession(session)]
                const IconComponent = category.icon
                const duration = session.ended_at ? session.ended_at - session.started_at : 0
                
                return (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 ${category.bgColor} rounded-lg`}>
                        <IconComponent className={`h-4 w-4 ${category.textColor}`} />
                      </div>
                      <div>
                        <Link href={`/activity/details?sessionId=${session.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                          {session.title || `Activity - ${new Date(session.started_at * 1000).toLocaleDateString()}`}
                        </Link>
                        <p className="text-sm text-gray-500">
                          {new Date(session.started_at * 1000).toLocaleString()} • {formatDuration(duration)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 ${category.bgColor} ${category.textColor} rounded-full text-xs font-medium`}>
                        {category.label}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          handleDelete(session.id)
                        }}
                        disabled={deletingId === session.id}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">
                {searchQuery || selectedCategory !== 'all' ? 'No matching activities found.' : 'No activities yet.'}
              </p>
              <p className="text-sm text-gray-400">
                {searchQuery || selectedCategory !== 'all' ? 'Try adjusting your filters.' : 'Start using Glass to track your productivity automatically.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderTimeline = () => (
    <div className="space-y-6">
      {/* Enhanced Timeline Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Calendar className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
                <p className="text-sm text-gray-600">Visual breakdown of your daily activities</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {metrics.dailyActivities.length > 0 ? (
            <div className="space-y-6">
              {/* Timeline Visualization */}
              {metrics.dailyActivities.slice(0, 7).map((day, index) => {
                const totalActivities = day.count
                const isToday = new Date(day.date).toDateString() === new Date().toDateString()
                
                return (
                  <div key={day.date} className={`relative p-4 rounded-lg border-2 transition-all ${
                    isToday ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 bg-gray-50'
                  }`}>
                    {/* Date Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          isToday ? 'bg-indigo-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <h4 className={`font-medium ${
                            isToday ? 'text-indigo-900' : 'text-gray-900'
                          }`}>
                            {new Date(day.date).toLocaleDateString(undefined, { 
                              weekday: 'long', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </h4>
                          {isToday && (
                            <span className="text-xs text-indigo-600 font-medium">Today</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${
                          isToday ? 'text-indigo-900' : 'text-gray-900'
                        }`}>
                          {totalActivities}
                        </div>
                        <div className="text-xs text-gray-500">activities</div>
                      </div>
                    </div>
                    
                    {/* Activity Breakdown */}
                    <div className="space-y-3">
                      {/* Visual Bar */}
                      <div className="flex items-center space-x-1 h-8 bg-white rounded-lg overflow-hidden border border-gray-200">
                        {Object.entries(day.categories).map(([categoryKey, count]) => {
                          const category = ACTIVITY_CATEGORIES[categoryKey as CategoryKey]
                          const width = (count / totalActivities) * 100
                          return (
                            <div 
                              key={categoryKey}
                              className={`h-full ${category.bgColor} flex items-center justify-center text-xs ${category.textColor} font-medium transition-all hover:scale-105`}
                              style={{ width: `${Math.max(width, 15)}%` }}
                              title={`${category.label}: ${count} activities (${(width).toFixed(1)}%)`}
                            >
                              {count > 0 && count}
                            </div>
                          )
                        })}
                      </div>
                      
                      {/* Category Legend */}
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(day.categories).map(([categoryKey, count]) => {
                          const category = ACTIVITY_CATEGORIES[categoryKey as CategoryKey]
                          const IconComponent = category.icon
                          return (
                            <div key={categoryKey} className="flex items-center space-x-2 px-2 py-1 bg-white rounded-md border border-gray-200">
                              <IconComponent className={`h-3 w-3 ${category.textColor}`} />
                              <span className="text-xs text-gray-700">{category.label}</span>
                              <span className="text-xs font-medium text-gray-900">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    
                    {/* Productivity Indicator (if available) */}
                    {isToday && productivityScore && (
                      <div className="mt-3 pt-3 border-t border-indigo-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-indigo-700">Today's Productivity</span>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              productivityScore.score >= 8 ? 'bg-green-400' :
                              productivityScore.score >= 6 ? 'bg-yellow-400' : 'bg-red-400'
                            }`} />
                            <span className="text-sm font-medium text-indigo-900">
                              {productivityScore.score}/10
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No timeline data available yet</p>
              <p className="text-sm text-gray-400">Start tracking activities to see your daily patterns</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Weekly Summary */}
      {metrics.dailyActivities.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Weekly Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{metrics.totalSessions}</div>
              <div className="text-sm text-blue-700">Total Sessions</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">{formatDuration(metrics.totalTime)}</div>
              <div className="text-sm text-green-700">Total Time</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">{formatDuration(metrics.avgSessionLength)}</div>
              <div className="text-sm text-purple-700">Avg Session</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">{metrics.dailyActivities.length}</div>
              <div className="text-sm text-orange-700">Active Days</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderInsights = () => (
    <div className="space-y-8">
      {/* AI-Powered Insights Dashboard */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Gemini AI Analysis</h2>
              <p className="text-sm text-gray-600">Advanced productivity insights and recommendations</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {productivityScore && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-white rounded-full border border-purple-200">
                <div className={`w-2 h-2 rounded-full ${
                  productivityScore.score >= 8 ? 'bg-green-400' :
                  productivityScore.score >= 6 ? 'bg-yellow-400' : 'bg-red-400'
                }`} />
                <span className="text-sm font-medium text-gray-700">
                  Score: {productivityScore.score}/10
                </span>
              </div>
            )}
          </div>
        </div>

        {insights ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Productivity Trends */}
            <div className="bg-white rounded-lg p-5 border border-gray-100">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Productivity Trends</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Overall Trend</span>
                  <div className="flex items-center space-x-2">
                    {insights.trends?.productivity === 'improving' ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700 font-medium">Improving</span>
                      </>
                    ) : insights.trends?.productivity === 'declining' ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-700 font-medium">Declining</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-700 font-medium">Stable</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Focus Quality</span>
                  <div className="flex items-center space-x-2">
                    {insights.trends?.focus === 'improving' ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700 font-medium">Improving</span>
                      </>
                    ) : insights.trends?.focus === 'declining' ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-700 font-medium">Declining</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-700 font-medium">Stable</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="bg-white rounded-lg p-5 border border-gray-100">
              <div className="flex items-center space-x-2 mb-4">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <h3 className="font-semibold text-gray-900">Key Insights</h3>
              </div>
              <div className="space-y-3">
                {insights.insights.slice(0, 3).map((insight, index) => (
                  <div key={index} className={`p-3 rounded-lg border-l-4 ${
                    insight.importance === 'high' ? 'bg-red-50 border-red-400' :
                    insight.importance === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                    'bg-blue-50 border-blue-400'
                  }`}>
                    <div className="flex items-start space-x-2">
                      <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        insight.importance === 'high' ? 'bg-red-400' :
                        insight.importance === 'medium' ? 'bg-yellow-400' :
                        'bg-blue-400'
                      }`} />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{insight.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No AI insights available yet</p>
            <p className="text-sm text-gray-400">Start tracking your activity to generate personalized insights</p>
          </div>
        )}
      </div>

      {/* Detailed Recommendations */}
      {insights?.recommendations && insights.recommendations.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.recommendations.map((rec, index) => (
              <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">{rec.title}</h4>
                    <p className="text-sm text-blue-700 mt-1">{rec.description}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                      {rec.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Activity Feed */}
      {trackingStatus?.isTracking && (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Live Activity Monitor</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-green-600 font-medium">Live</span>
            </div>
          </div>
          
          {trackingStatus.currentActivity ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-900">{trackingStatus.currentActivity.title}</h4>
                    <p className="text-sm text-green-700 mt-1">Category: {trackingStatus.currentActivity.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-900">
                      {formatDuration((Date.now() - trackingStatus.currentActivity.startTime) / 1000)}
                    </div>
                    <div className="text-xs text-green-600">Duration</div>
                  </div>
                </div>
              </div>
              
              {trackingStatus.lastAnalysis && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">Latest AI Analysis</span>
                    <span className="text-xs text-blue-600">
                      {new Date(trackingStatus.lastAnalysis.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Category:</span>
                      <span className="ml-2 font-medium text-blue-900">{trackingStatus.lastAnalysis.category}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Confidence:</span>
                      <span className="ml-2 font-medium text-blue-900">{trackingStatus.lastAnalysis.confidence}%</span>
                    </div>
                  </div>
                </div>
              )}
              
              {trackingStatus.nextCaptureIn && (
                <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                  <Timer className="h-4 w-4 text-gray-600 mr-2" />
                  <span className="text-sm text-gray-700">
                    Next analysis in {Math.ceil(trackingStatus.nextCaptureIn / 1000 / 60)} minutes
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Waiting for activity detection...</p>
            </div>
          )}
        </div>
      )}

      {/* Privacy & Data Control */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Privacy & Data Control</h3>
          <button
            onClick={() => setShowPrivacyPanel(!showPrivacyPanel)}
            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <Shield className="h-4 w-4" />
            <span>Manage Privacy</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showPrivacyPanel ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {showPrivacyPanel && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Screenshot Storage</h4>
                <p className="text-sm text-gray-600">Screenshots are encrypted and stored locally</p>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Secure</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">AI Processing</h4>
                <p className="text-sm text-gray-600">Analysis happens locally when possible</p>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Private</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 pt-2">
              <button className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium">
                Delete All Data
              </button>
              <button className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                Export Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

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
              <p className="text-gray-600">Track your productivity and insights</p>
            </div>
            
            {/* View Mode Tabs */}
            <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'dashboard' 
                    ? 'bg-blue-100 text-blue-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'timeline' 
                    ? 'bg-blue-100 text-blue-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Timeline</span>
              </button>
              <button
                onClick={() => setViewMode('insights')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'insights' 
                    ? 'bg-blue-100 text-blue-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Brain className="h-4 w-4" />
                <span>AI Insights</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'dashboard' && renderDashboard()}
        {viewMode === 'timeline' && renderTimeline()}
        {viewMode === 'insights' && renderInsights()}
      </div>
    </div>
  )
} 