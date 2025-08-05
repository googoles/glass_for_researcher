'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
      // Enhanced mock data with realistic research projects
      const mockProjects: ResearchProject[] = [
        {
          id: '1',
          title: 'AI Ethics in Healthcare',
          category: 'academic',
          description: 'Investigating ethical implications of AI in medical diagnosis and patient privacy',
          startDate: '2024-01-15',
          lastActive: '2024-08-02',
          status: 'active',
          progress: 72,
          papersCount: 28,
          notesCount: 54,
          collaborators: 3,
          tags: ['AI', 'Ethics', 'Healthcare', 'Machine Learning', 'Privacy'],
          priority: 'high',
          timeSpent: 2340, // 39 hours
          estimatedCompletion: '2024-09-15',
          goals: ['Review 50 papers on AI ethics', 'Interview 10 healthcare professionals', 'Draft policy recommendations'],
          lastActivity: {
            type: 'analysis',
            description: 'Analyzed patient consent frameworks in AI systems',
            timestamp: '2024-08-02T14:30:00Z'
          }
        },
        {
          id: '2',
          title: 'Quantum Computing Applications',
          category: 'technical',
          description: 'Exploring quantum algorithms for optimization problems in logistics',
          startDate: '2024-02-01',
          lastActive: '2024-08-01',
          status: 'active',
          progress: 45,
          papersCount: 19,
          notesCount: 32,
          collaborators: 2,
          tags: ['Quantum Computing', 'Algorithms', 'Optimization', 'Logistics'],
          priority: 'medium',
          timeSpent: 1680, // 28 hours
          estimatedCompletion: '2024-10-30',
          goals: ['Implement 3 quantum algorithms', 'Benchmark against classical methods', 'Publish findings'],
          lastActivity: {
            type: 'paper_added',
            description: 'Added IBM quantum computing paper to collection',
            timestamp: '2024-08-01T16:15:00Z'
          }
        },
        {
          id: '3',
          title: 'Sustainable Energy Markets',
          category: 'market',
          description: 'Market analysis of renewable energy adoption in emerging economies',
          startDate: '2024-01-20',
          lastActive: '2024-07-30',
          status: 'paused',
          progress: 85,
          papersCount: 45,
          notesCount: 78,
          collaborators: 4,
          tags: ['Renewable Energy', 'Market Analysis', 'Economics', 'Policy'],
          priority: 'low',
          timeSpent: 3240, // 54 hours
          estimatedCompletion: '2024-08-15',
          goals: ['Complete regional market analysis', 'Model policy impacts', 'Draft executive summary'],
          lastActivity: {
            type: 'milestone',
            description: 'Completed Southeast Asia market segment analysis',
            timestamp: '2024-07-30T11:20:00Z'
          }
        },
        {
          id: '4',
          title: 'Neural Architecture Search',
          category: 'technical',
          description: 'Automated design of neural networks for computer vision tasks',
          startDate: '2024-06-01',
          lastActive: '2024-08-03',
          status: 'active',
          progress: 30,
          papersCount: 15,
          notesCount: 23,
          collaborators: 1,
          tags: ['Neural Networks', 'AutoML', 'Computer Vision', 'Architecture'],
          priority: 'high',
          timeSpent: 840, // 14 hours
          estimatedCompletion: '2024-11-01',
          goals: ['Implement NAS framework', 'Test on 5 vision datasets', 'Compare with manual designs'],
          lastActivity: {
            type: 'note',
            description: 'Added notes on evolutionary search strategies',
            timestamp: '2024-08-03T09:45:00Z'
          }
        },
        {
          id: '5',
          title: 'Digital Therapeutics Regulation',
          category: 'academic',
          description: 'Comparative study of regulatory frameworks for digital health interventions',
          startDate: '2023-11-10',
          lastActive: '2024-05-20',
          status: 'completed',
          progress: 100,
          papersCount: 67,
          notesCount: 112,
          collaborators: 6,
          tags: ['Digital Health', 'Regulation', 'Policy', 'Healthcare', 'Law'],
          priority: 'medium',
          timeSpent: 4320, // 72 hours
          goals: ['Review FDA guidance', 'Compare international frameworks', 'Publish white paper'],
          lastActivity: {
            type: 'milestone',
            description: 'Published final report and recommendations',
            timestamp: '2024-05-20T15:30:00Z'
          }
        }
      ]
      setResearchProjects(mockProjects)
    } catch (error) {
      console.error('Failed to fetch research projects:', error)
    }
  }, [])

  const fetchAnalyticsData = useCallback(async () => {
    try {
      // Mock analytics data
      const mockAnalytics: AnalyticsData = {
        weeklyTrend: [
          { date: '2024-07-28', productivity: 7.2, focus: 8.1 },
          { date: '2024-07-29', productivity: 8.4, focus: 7.8 },
          { date: '2024-07-30', productivity: 6.9, focus: 7.2 },
          { date: '2024-07-31', productivity: 8.8, focus: 9.1 },
          { date: '2024-08-01', productivity: 7.6, focus: 8.3 },
          { date: '2024-08-02', productivity: 9.2, focus: 8.9 },
          { date: '2024-08-03', productivity: 8.1, focus: 7.7 }
        ],
        categoryDistribution: [
          { category: 'Academic', value: 40, color: '#3B82F6' },
          { category: 'Technical', value: 35, color: '#8B5CF6' },
          { category: 'Market', value: 20, color: '#10B981' },
          { category: 'Other', value: 5, color: '#6B7280' }
        ],
        focusHeatmap: Array.from({ length: 24 }, (_, hour) => 
          Array.from({ length: 7 }, (_, day) => ({
            hour,
            day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day],
            intensity: Math.random() * 10
          }))
        ).flat(),
        productivityTrend: 'improving',
        avgSessionLength: 127, // minutes
        peakProductivityHour: 14, // 2 PM
        totalResearchTime: 12420, // minutes
        streakDays: 12
      }
      setAnalyticsData(mockAnalytics)
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
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
                        {selectedProject.goals.map((goal, index) => (
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
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time Spent</span>
                        <span className="font-medium">{formatDuration(selectedProject.timeSpent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Papers</span>
                        <span className="font-medium">{selectedProject.papersCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Notes</span>
                        <span className="font-medium">{selectedProject.notesCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Team Size</span>
                        <span className="font-medium">{selectedProject.collaborators}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.tags.map((tag, index) => (
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
                  <p className="text-gray-600 text-lg">Transform your research with AI-powered insights</p>
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
    </div>
  )
}