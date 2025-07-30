'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRedirectIfNotAuth } from '@/utils/auth'
import {
  UserProfile,
  apiCall
} from '@/utils/api'
import ZoteroConnector from '@/components/ZoteroConnector'
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
  Sparkles,
  FileText,
  Download,
  Upload,
  Play,
  Pause,
  Users,
  Database,
  Microscope
} from 'lucide-react'

interface ZoteroItem {
  key: string
  title: string
  creators: Array<{ firstName: string; lastName: string }>
  date: string
  itemType: string
  abstract?: string
  tags?: Array<{ tag: string }>
  url?: string
  DOI?: string
}

// Research categories with icons and colors
const RESEARCH_CATEGORIES = {
  academic: { icon: BookOpen, label: 'Academic Research', color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  technical: { icon: Focus, label: 'Technical Analysis', color: 'purple', bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200' },
  market: { icon: TrendingUp, label: 'Market Research', color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
  collaborative: { icon: Users, label: 'Collaborative Study', color: 'indigo', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700', borderColor: 'border-indigo-200' },
  data: { icon: Database, label: 'Data Analysis', color: 'teal', bgColor: 'bg-teal-50', textColor: 'text-teal-700', borderColor: 'border-teal-200' },
  experimental: { icon: Microscope, label: 'Experimental', color: 'orange', bgColor: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-200' },
  other: { icon: MoreVertical, label: 'Other', color: 'gray', bgColor: 'bg-gray-50', textColor: 'text-gray-700', borderColor: 'border-gray-200' }
} as const

type ViewMode = 'dashboard' | 'timeline' | 'insights' | 'projects'
type CategoryKey = keyof typeof RESEARCH_CATEGORIES

interface ResearchMetrics {
  totalProjects: number
  totalTime: number
  avgSessionLength: number
  categoryCounts: Record<CategoryKey, number>
  pdfsTracked: number
  papersAnalyzed: number
}

interface TrackingStatus {
  isTracking: boolean
  currentProject: {
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
    content: string
  } | null
  captureInterval: number
  nextCaptureIn: number | null
  zoteroConnected: boolean
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

interface ResearchProject {
  id: string
  title: string
  category: CategoryKey
  description: string
  startDate: string
  lastActive: string
  status: 'active' | 'paused' | 'completed'
  progress: number
  papersCount: number
  notesCount: number
  collaborators: number
  tags: string[]
}

export default function ResearchPage() {
  const userInfo = useRedirectIfNotAuth() as UserProfile | null;
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showPrivacyPanel, setShowPrivacyPanel] = useState(false)
  
  // Enhanced state for research tracking
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus | null>(null)
  const [productivityScore, setProductivityScore] = useState<ProductivityScore | null>(null)
  const [insights, setInsights] = useState<InsightData | null>(null)
  const [isLoadingTracking, setIsLoadingTracking] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [researchProjects, setResearchProjects] = useState<ResearchProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPaper, setSelectedPaper] = useState<ZoteroItem | null>(null)
  const [showZoteroPanel, setShowZoteroPanel] = useState(false)

  const fetchTrackingStatus = useCallback(async () => {
    try {
      const response = await apiCall('/api/research/status')
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
      const response = await apiCall('/api/research/insights/week')
      if (response.ok) {
        const insightData = await response.json()
        setInsights(insightData)
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error)
    }
  }, [])

  const fetchResearchProjects = useCallback(async () => {
    try {
      // Mock data for now - would come from research tracking
      const mockProjects: ResearchProject[] = [
        {
          id: '1',
          title: 'AI Ethics in Healthcare',
          category: 'academic',
          description: 'Investigating ethical implications of AI in medical diagnosis',
          startDate: '2024-01-15',
          lastActive: '2024-07-29',
          status: 'active',
          progress: 65,
          papersCount: 23,
          notesCount: 45,
          collaborators: 3,
          tags: ['AI', 'Ethics', 'Healthcare', 'Machine Learning']
        },
        {
          id: '2',
          title: 'Market Analysis: Renewable Energy',
          category: 'market',
          description: 'Comprehensive analysis of renewable energy market trends',
          startDate: '2024-02-01',
          lastActive: '2024-07-28',
          status: 'active',
          progress: 40,
          papersCount: 15,
          notesCount: 32,
          collaborators: 2,
          tags: ['Renewable Energy', 'Market Research', 'Sustainability']
        },
        {
          id: '3',
          title: 'Neural Network Optimization',
          category: 'technical',
          description: 'Research on optimization techniques for deep neural networks',
          startDate: '2024-01-20',
          lastActive: '2024-07-20',
          status: 'completed',
          progress: 100,
          papersCount: 31,
          notesCount: 67,
          collaborators: 1,
          tags: ['Neural Networks', 'Optimization', 'Deep Learning']
        }
      ]
      setResearchProjects(mockProjects)
    } catch (error) {
      console.error('Failed to fetch research projects:', error)
    }
  }, [])

  const startTracking = async () => {
    setIsLoadingTracking(true)
    try {
      const response = await apiCall('/api/research/start', { method: 'POST' })
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
      const response = await apiCall('/api/research/stop', { method: 'POST' })
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
      const response = await apiCall('/api/research/analysis/manual-capture', { method: 'POST' })
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
      fetchInsights(),
      fetchResearchProjects()
    ])
    setLastRefresh(Date.now())
    setIsLoading(false)
  }, [fetchTrackingStatus, fetchProductivityScore, fetchInsights, fetchResearchProjects])

  const handlePaperSelected = (paper: ZoteroItem) => {
    setSelectedPaper(paper)
    console.log('Selected paper for analysis:', paper)
    // TODO: Integrate with research tracking to analyze selected paper
  }

  useEffect(() => {
    if (userInfo) {
      refreshData()
    }
  }, [userInfo, refreshData])

  // Auto-refresh data every 30 seconds when tracking is active
  useEffect(() => {
    if (!autoRefresh || !trackingStatus?.isTracking) return
    
    const interval = setInterval(refreshData, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, trackingStatus?.isTracking, refreshData])

  // Calculate research metrics
  const calculateMetrics = (): ResearchMetrics => {
    const totalProjects = researchProjects.length
    const totalTime = researchProjects.reduce((acc, project) => {
      const daysSinceStart = Math.floor(
        (new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      return acc + daysSinceStart * 2 * 60 * 60 * 1000 // Estimate 2 hours per day
    }, 0)
    const avgSessionLength = totalProjects > 0 ? totalTime / totalProjects : 0

    const categoryCounts = researchProjects.reduce((acc, project) => {
      acc[project.category] = (acc[project.category] || 0) + 1
      return acc
    }, {} as Record<CategoryKey, number>)

    const pdfsTracked = researchProjects.reduce((sum, p) => sum + p.papersCount, 0)
    const papersAnalyzed = Math.floor(pdfsTracked * 0.7) // Estimate 70% analyzed

    return { totalProjects, totalTime, avgSessionLength, categoryCounts, pdfsTracked, papersAnalyzed }
  }

  const metrics = calculateMetrics()
  
  // Filter projects based on selected category and search
  const filteredProjects = researchProjects.filter(project => {
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
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

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* AI-Powered Research Tracking Panel */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Microscope className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Research Intelligence Hub</h2>
              <p className="text-sm text-gray-600">AI-powered research tracking and analysis with Zotero integration</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshData}
              className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <div className={`w-2 h-2 rounded-full ${
                trackingStatus?.isTracking ? 'bg-green-400 animate-pulse' : 'bg-gray-300'
              }`} />
              <span>{trackingStatus?.isTracking ? 'Tracking Active' : 'Tracking Inactive'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Research Tracking Controls */}
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Research Tracking</h3>
              <BookOpen className="h-4 w-4 text-gray-600" />
            </div>
            <div className="space-y-3">
              <button
                onClick={trackingStatus?.isTracking ? stopTracking : startTracking}
                disabled={isLoadingTracking}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  trackingStatus?.isTracking
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
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
                   trackingStatus?.isTracking ? 'Stop Research' : 'Start Research'}
                </span>
              </button>
              
              {trackingStatus?.isTracking && (
                <button
                  onClick={triggerManualCapture}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  <span>Capture Analysis</span>
                </button>
              )}
            </div>
            
            {trackingStatus?.currentProject && (
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Timer className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-900">Current Research</span>
                </div>
                <p className="text-sm text-indigo-800">{trackingStatus.currentProject.title}</p>
                <p className="text-xs text-indigo-600 mt-1">
                  {formatDuration((Date.now() - trackingStatus.currentProject.startTime) / 1000)}
                </p>
              </div>
            )}
          </div>

          {/* Real-time Research Score */}
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Research Quality</h3>
              <Brain className="h-4 w-4 text-gray-600" />
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
                <div className="text-gray-400 text-sm">Start research tracking to see quality metrics</div>
              </div>
            )}
          </div>

          {/* Zotero Integration Status */}
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Zotero Integration</h3>
              <Database className="h-4 w-4 text-gray-600" />
            </div>
            <div className="space-y-3">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                trackingStatus?.zoteroConnected ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  trackingStatus?.zoteroConnected ? 'bg-green-400' : 'bg-yellow-400'
                }`} />
                <span className={`text-sm font-medium ${
                  trackingStatus?.zoteroConnected ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {trackingStatus?.zoteroConnected ? 'Connected' : 'Setup Required'}
                </span>
              </div>
              
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>PDFs Tracked:</span>
                  <span className="font-medium">{metrics.pdfsTracked}</span>
                </div>
                <div className="flex justify-between">
                  <span>Papers Analyzed:</span>
                  <span className="font-medium">{metrics.papersAnalyzed}</span>
                </div>
              </div>
              
              {!trackingStatus?.zoteroConnected && (
                <button 
                  onClick={() => setShowZoteroPanel(true)}
                  className="w-full px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                >
                  Connect Zotero
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Research Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.totalProjects}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Research Time</p>
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
              <p className="text-sm font-medium text-gray-600">Papers Tracked</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.pdfsTracked}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Data Security</p>
              <p className="text-sm font-medium text-green-600">Encrypted</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Research Categories */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Research Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {Object.entries(RESEARCH_CATEGORIES).map(([key, category]) => {
            const count = metrics.categoryCounts[key as CategoryKey] || 0
            const percentage = metrics.totalProjects > 0 ? (count / metrics.totalProjects * 100).toFixed(1) : '0'
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

      {/* Recent Research Projects */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Research Projects</h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as CategoryKey | 'all')}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {Object.entries(RESEARCH_CATEGORIES).map(([key, category]) => (
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
              <p className="mt-4 text-gray-600">Loading research projects...</p>
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="space-y-4">
              {filteredProjects.map((project) => {
                const category = RESEARCH_CATEGORIES[project.category]
                const IconComponent = category.icon
                
                return (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`p-2 ${category.bgColor} rounded-lg`}>
                          <IconComponent className={`h-5 w-5 ${category.textColor}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900">{project.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              project.status === 'active' ? 'bg-green-100 text-green-700' :
                              project.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {project.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                            <span className="flex items-center space-x-1">
                              <FileText className="h-3 w-3" />
                              <span>{project.papersCount} papers</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{project.collaborators} collaborators</span>
                            </span>
                            <span>Started {new Date(project.startDate).toLocaleDateString()}</span>
                            <span>Active {new Date(project.lastActive).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{project.progress}%</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {project.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Microscope className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">
                {searchQuery || selectedCategory !== 'all' ? 'No matching research projects found.' : 'No research projects yet.'}
              </p>
              <p className="text-sm text-gray-400">
                {searchQuery || selectedCategory !== 'all' ? 'Try adjusting your filters.' : 'Start research tracking to monitor your academic work automatically.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Zotero Integration Panel */}
      {showZoteroPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Zotero Paper Analysis</h2>
              <button
                onClick={() => setShowZoteroPanel(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <ZoteroConnector onPaperSelected={handlePaperSelected} />
            
            {selectedPaper && (
              <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <h3 className="font-medium text-indigo-900 mb-2">Selected for Analysis</h3>
                <p className="text-sm text-indigo-800 mb-1">{selectedPaper.title}</p>
                <p className="text-xs text-indigo-600">
                  {selectedPaper.creators.map(c => `${c.firstName} ${c.lastName}`).join(', ')}
                </p>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => {
                      // TODO: Start research session with selected paper
                      console.log('Starting research session with paper:', selectedPaper.title)
                      setShowZoteroPanel(false)
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Start Research Session
                  </button>
                  <button
                    onClick={() => setSelectedPaper(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
              <p className="text-gray-600">Track your research and academic productivity</p>
            </div>
            
            {/* View Mode Tabs */}
            <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'dashboard' 
                    ? 'bg-indigo-100 text-indigo-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setViewMode('projects')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'projects' 
                    ? 'bg-indigo-100 text-indigo-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Projects</span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'timeline' 
                    ? 'bg-indigo-100 text-indigo-700 shadow-sm' 
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
                    ? 'bg-indigo-100 text-indigo-700 shadow-sm' 
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
        {viewMode === 'projects' && renderDashboard()}
        {viewMode === 'timeline' && renderDashboard()}
        {viewMode === 'insights' && renderDashboard()}
      </div>
    </div>
  )
}