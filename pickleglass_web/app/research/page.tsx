'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRedirectIfNotAuth } from '@/utils/auth'
import {
  UserProfile,
  apiCall
} from '@/utils/api'
import { getEnvironmentFeatures, isActivityTrackingAvailable, isElectronEnvironmentAsync, debugEnvironmentDetection } from '@/utils/environment'
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
  Microscope,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  ArrowRight,
  TrendingDown,
  PieChart,
  LineChart,
  Star,
  Calendar as CalendarIcon,
  Award,
  Bookmark,
  Hash,
  Globe,
  Archive,
  ChevronRight,
  Move,
  Copy,
  FolderOpen,
  MousePointer,
  HelpCircle,
  Info,
  X
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
  estimatedCompletion?: string
  priority: 'high' | 'medium' | 'low'
  timeSpent: number // in minutes
  goals: string[]
  lastActivity: {
    type: 'analysis' | 'note' | 'paper_added' | 'milestone'
    description: string
    timestamp: string
  }
}

interface ProjectFormData {
  title: string
  description: string
  category: CategoryKey
  priority: 'high' | 'medium' | 'low'
  goals: string[]
  tags: string[]
}

interface AnalyticsData {
  weeklyTrend: Array<{ date: string; productivity: number; focus: number }>
  categoryDistribution: Array<{ category: string; value: number; color: string }>
  focusHeatmap: Array<{ hour: number; day: string; intensity: number }>
  productivityTrend: 'improving' | 'declining' | 'stable'
  avgSessionLength: number
  peakProductivityHour: number
  totalResearchTime: number
  streakDays: number
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
  const [environmentFeatures, setEnvironmentFeatures] = useState(getEnvironmentFeatures())
  const [envCheckComplete, setEnvCheckComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPaper, setSelectedPaper] = useState<ZoteroItem | null>(null)
  const [showZoteroPanel, setShowZoteroPanel] = useState(false)
  
  // New state for enhanced features
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingProject, setEditingProject] = useState<ResearchProject | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [selectedProject, setSelectedProject] = useState<ResearchProject | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [sortBy, setSortBy] = useState<'lastActive' | 'progress' | 'priority' | 'title'>('lastActive')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'completed'>('all')
  const [projectFormData, setProjectFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    category: 'academic',
    priority: 'medium',
    goals: [],
    tags: []
  })

  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    category: 'academic' as keyof typeof RESEARCH_CATEGORIES,
    status: 'active' as 'active' | 'completed' | 'paused',
    priority: 'medium' as 'low' | 'medium' | 'high'
  })

  // Helper functions
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return time.toLocaleDateString()
  }

  const fetchTrackingStatus = useCallback(async () => {
    // Only fetch tracking status in environments that support it
    if (!environmentFeatures.activityTracking) {
      setTrackingStatus({
        isTracking: false,
        currentProject: null,
        lastAnalysis: null,
        captureInterval: 300000, // 5 minutes
        nextCaptureIn: null,
        zoteroConnected: false
      })
      return
    }
    
    try {
      const response = await apiCall('/api/research/status')
      if (response.ok) {
        const status = await response.json()
        setTrackingStatus(status)
      }
    } catch (error) {
      console.error('Failed to fetch tracking status:', error)
    }
  }, [environmentFeatures.activityTracking])

  const fetchProductivityScore = useCallback(async () => {
    // Only fetch productivity score in environments that support it
    if (!environmentFeatures.activityTracking) {
      return
    }
    
    try {
      const response = await apiCall('/api/research/analysis/current-score')
      if (response.ok) {
        const score = await response.json()
        setProductivityScore(score)
      }
    } catch (error) {
      console.error('Failed to fetch productivity score:', error)
    }
  }, [environmentFeatures.activityTracking])

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
      // Fetch real projects from API instead of using mock data
      const response = await apiCall('/api/research/projects')
      if (response.ok) {
        const data = await response.json()
        const projects = data.data || data || []
        setResearchProjects(Array.isArray(projects) ? projects : [])
      } else {
        setResearchProjects([])
      }
    } catch (error) {
      console.error('Failed to fetch research projects:', error)
      setResearchProjects([])
    }
  }, [])

  const fetchAnalyticsData = useCallback(async () => {
    try {
      // Fetch real analytics from API instead of using mock data
      const response = await apiCall('/api/research/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data.data || null)
      } else {
        setAnalyticsData(null)
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
      setAnalyticsData(null)
    }
  }, [])

  const startTracking = async () => {
    if (!environmentFeatures.activityTracking) {
      alert('Activity tracking is only available in the desktop app. Please download and use the Pickle Glass desktop application.')
      return
    }
    
    setIsLoadingTracking(true)
    try {
      const response = await apiCall('/api/research/start', { method: 'POST' })
      if (response.ok) {
        await fetchTrackingStatus()
      }
    } catch (error) {
      console.error('Failed to start tracking:', error)
      alert('Failed to start tracking. Please ensure the desktop app is running.')
    } finally {
      setIsLoadingTracking(false)
    }
  }

  const stopTracking = async () => {
    if (!environmentFeatures.activityTracking) {
      alert('Activity tracking is only available in the desktop app.')
      return
    }
    
    setIsLoadingTracking(true)
    try {
      const response = await apiCall('/api/research/stop', { method: 'POST' })
      if (response.ok) {
        await fetchTrackingStatus()
      }
    } catch (error) {
      console.error('Failed to stop tracking:', error)
      alert('Failed to stop tracking. Please ensure the desktop app is running.')
    } finally {
      setIsLoadingTracking(false)
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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const projectData: ResearchProject = {
        ...newProject,
        id: Date.now().toString(),
        startDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        progress: 0,
        papersCount: 0,
        notesCount: 0,
        collaborators: 0,
        tags: [],
        timeSpent: 0,
        goals: [],
        lastActivity: {
          type: 'milestone',
          description: 'Project created',
          timestamp: new Date().toISOString()
        }
      }

      if (editingProject) {
        // Update existing project
        const updatedProjects = researchProjects.map(p => 
          p.id === editingProject.id ? { ...p, ...projectData, id: editingProject.id } : p
        )
        setResearchProjects(updatedProjects)
      } else {
        // Create new project
        setResearchProjects(prev => [...prev, projectData])
      }

      // Reset form and close modal
      setNewProject({
        title: '',
        description: '',
        category: 'academic',
        status: 'active',
        priority: 'medium'
      })
      setShowProjectForm(false)
      setEditingProject(null)

      console.log('Project saved:', projectData)
      // TODO: Save to backend API
    } catch (error) {
      console.error('Failed to save project:', error)
    }
  }

  useEffect(() => {
    if (userInfo) {
      refreshData()
    }
      // Additional environment check for Electron context
    const checkEnvironment = async () => {
      try {
        // Debug current environment detection
        debugEnvironmentDetection();
        
        // Double-check with async method
        const isElectronAsync = await isElectronEnvironmentAsync();
        const currentFeatures = getEnvironmentFeatures();
        
        console.log('Research environment check results:', {
          isElectronAsync,
          currentFeatures,
          shouldShowDesktop: isElectronAsync || currentFeatures.isElectron
        });
        
        // If async check shows we're in Electron but current features don't, update
        if (isElectronAsync && currentFeatures.isWeb) {
          setEnvironmentFeatures({
            ...currentFeatures,
            isElectron: true,
            isWeb: false,
            activityTracking: true,
            screenCapture: true,
            fileSystem: true,
            notifications: true,
            systemIntegration: true,
            webOnlyFeatures: false
          });
        } else {
          setEnvironmentFeatures(currentFeatures);
        }
        
        setEnvCheckComplete(true);
      } catch (error) {
        console.warn('Environment check failed:', error);
        setEnvironmentFeatures(getEnvironmentFeatures());
        setEnvCheckComplete(true);
      }
    };
    
    checkEnvironment();
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
    const totalTime = 0 // Remove time calculations
    const avgSessionLength = 0

    const categoryCounts = (Array.isArray(researchProjects) ? researchProjects : []).reduce((acc, project) => {
      acc[project.category] = (acc[project.category] || 0) + 1
      return acc
    }, {} as Record<CategoryKey, number>)

    const pdfsTracked = 0 // Remove PDF tracking
    const papersAnalyzed = 0 // Remove paper analysis count

    return { totalProjects, totalTime, avgSessionLength, categoryCounts, pdfsTracked, papersAnalyzed }
  }

  const metrics = calculateMetrics()
  
  // Filter projects based on selected category and search
  const filteredProjects = (Array.isArray(researchProjects) ? researchProjects : []).filter(project => {
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
              <p className="text-sm text-gray-600">Organize and manage your research projects with AI assistance</p>
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
              {!envCheckComplete ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                  <div className="spinner h-6 w-6 mx-auto"></div>
                  <p className="text-gray-500 text-sm mt-2">Checking environment...</p>
                </div>
              ) : environmentFeatures.activityTracking ? (
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
              ) : (
                <div className="text-center py-4">
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 mb-3">
                    <div className="flex items-center space-x-2 text-amber-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Desktop App Required</span>
                    </div>
                    <p className="text-xs text-amber-600 mt-1">
                      Activity tracking is only available in the Pickle Glass desktop application.
                    </p>
                  </div>
                  <a 
                    href="/download" 
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Desktop App</span>
                  </a>
                </div>
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


      {/* Research Categories */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Research Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {Object.entries(RESEARCH_CATEGORIES).map(([key, category]) => {
            const count = metrics.categoryCounts[key as CategoryKey] || 0
            const IconComponent = category.icon
            
            return (
              <div key={key} className={`${category.bgColor} ${category.borderColor} border rounded-lg p-4 text-center cursor-pointer transition-all hover:shadow-md`}
                   onClick={() => setSelectedCategory(key as CategoryKey)}>
                <IconComponent className={`h-6 w-6 ${category.textColor} mx-auto mb-2`} />
                <p className="text-sm font-medium text-gray-900">{count}</p>
                <p className="text-xs text-gray-600">{category.label}</p>
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
                            {Array.isArray(project.tags) && project.tags.map((tag, index) => (
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
            <div className="text-center py-16">
              <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Microscope className="h-12 w-12 text-indigo-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery || selectedCategory !== 'all' || filterStatus !== 'all' ? 'No matching projects found' : 'Start your research journey'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchQuery || selectedCategory !== 'all' || filterStatus !== 'all' 
                  ? 'Try adjusting your search filters or creating a new project.' 
                  : 'Create your first research project to begin tracking your academic progress with AI-powered insights.'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => setShowProjectForm(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Your First Project</span>
                </button>
                {(searchQuery || selectedCategory !== 'all' || filterStatus !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory('all')
                      setFilterStatus('all')
                    }}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderProjectForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </h2>
            <button
              onClick={() => {
                setShowProjectForm(false)
                setEditingProject(null)
                setNewProject({
                  title: '',
                  description: '',
                  category: 'academic',
                  status: 'active',
                  priority: 'medium'
                })
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>

          <form onSubmit={handleCreateProject} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter project title..."
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe your research project..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={newProject.category}
                  onChange={(e) => setNewProject({ ...newProject, category: e.target.value as keyof typeof RESEARCH_CATEGORIES })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {Object.entries(RESEARCH_CATEGORIES).map(([key, category]) => (
                    <option key={key} value={key}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={newProject.status}
                  onChange={(e) => setNewProject({ ...newProject, status: e.target.value as 'active' | 'completed' | 'paused' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  value={newProject.priority}
                  onChange={(e) => setNewProject({ ...newProject, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                {editingProject ? 'Update Project' : 'Create Project'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProjectForm(false)
                  setEditingProject(null)
                  setNewProject({
                    title: '',
                    description: '',
                    category: 'academic',
                    status: 'active',
                    priority: 'medium'
                  })
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )

  const renderOnboarding = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-lg w-full mx-4">
        <div className="p-8 text-center">
          <div className="p-4 bg-indigo-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Microscope className="h-10 w-10 text-indigo-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Research Intelligence
          </h2>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            Glass will track your research activities, analyze your productivity patterns, 
            and help you optimize your research workflows. Start by creating your first research project.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setShowOnboarding(false)
                setShowProjectForm(true)
              }}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Create Your First Project
            </button>
            
            <button
              onClick={() => setShowOnboarding(false)}
              className="w-full text-gray-500 py-2 px-6 rounded-lg hover:text-gray-700 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
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
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                  <Microscope className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {getGreeting()}, {userInfo?.display_name?.split(' ')[0] || 'Researcher'}
                  </h1>
                  <p className="text-gray-600 text-lg">Organize and manage your research projects efficiently</p>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              <Link 
                href="/research/ai-dashboard"
                className="flex items-center space-x-2 px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
              >
                <Brain className="h-4 w-4" />
                <span>AI Dashboard</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
              
              <button
                onClick={() => setShowZoteroPanel(true)}
                className="flex items-center space-x-2 px-4 py-2 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
              >
                <Database className="h-4 w-4" />
                <span>Zotero</span>
              </button>
              
              <button
                onClick={() => setShowProjectForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>New Project</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {renderDashboard()}
      </div>

      {/* Modals */}
      {showProjectForm && renderProjectForm()}
      {showOnboarding && renderOnboarding()}
      
      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 ${RESEARCH_CATEGORIES[selectedProject.category].bgColor} rounded-xl`}>
                    {React.createElement(RESEARCH_CATEGORIES[selectedProject.category].icon, {
                      className: `h-6 w-6 ${RESEARCH_CATEGORIES[selectedProject.category].textColor}`
                    })}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedProject.title}</h2>
                    <p className="text-gray-600">{RESEARCH_CATEGORIES[selectedProject.category].label}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{selectedProject.description}</p>
                  </div>
                  
                  {selectedProject.goals && selectedProject.goals.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Research Goals</h3>
                      <div className="space-y-2">
                        {Array.isArray(selectedProject.goals) && selectedProject.goals.map((goal, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <Target className="h-5 w-5 text-indigo-600 mt-0.5" />
                            <span className="text-gray-700">{goal}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h3>
                    <div className="p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-400">
                      <div className="flex items-center space-x-2 mb-2">
                        <Activity className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-900">
                          {selectedProject.lastActivity.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-indigo-800">{selectedProject.lastActivity.description}</p>
                      <p className="text-xs text-indigo-600 mt-2">
                        {formatTimeAgo(selectedProject.lastActivity.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Project Stats</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{selectedProject.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${selectedProject.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(selectedProject.tags) && selectedProject.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Timeline</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Started</span>
                        <span>{new Date(selectedProject.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Active</span>
                        <span>{new Date(selectedProject.lastActive).toLocaleDateString()}</span>
                      </div>
                      {selectedProject.estimatedCompletion && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Est. Completion</span>
                          <span>{new Date(selectedProject.estimatedCompletion).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <X className="h-6 w-6" />
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
}