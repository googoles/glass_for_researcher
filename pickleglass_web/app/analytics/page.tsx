'use client';

import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Clock, Target, BarChart3, PieChart, Zap, Award } from 'lucide-react';
import ActivityTimelineChart from '../../components/ActivityTimelineChart';

interface ProductivityMetrics {
  score: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  peakHours: string[];
  focusTime: number;
  distractionTime: number;
  completedTasks: number;
  averageSessionLength: number;
}

interface WeeklyStats {
  totalHours: number;
  productiveHours: number;
  completedProjects: number;
  averageScore: number;
  dailyScores: { date: string; score: number }[];
  categoryBreakdown: Record<string, number>;
}

interface GoalProgress {
  daily: { target: number; actual: number; percentage: number };
  weekly: { target: number; actual: number; percentage: number };
  monthly: { target: number; actual: number; percentage: number };
}

export default function ProductivityAnalysisPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedView, setSelectedView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [metrics, setMetrics] = useState<ProductivityMetrics>({
    score: 8.5,
    trend: 'up',
    change: 0.7,
    peakHours: ['9:00-11:00', '14:00-16:00'],
    focusTime: 6.5 * 60 * 60 * 1000,
    distractionTime: 1.5 * 60 * 60 * 1000,
    completedTasks: 12,
    averageSessionLength: 45 * 60 * 1000
  });
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    totalHours: 42,
    productiveHours: 35,
    completedProjects: 3,
    averageScore: 8.2,
    dailyScores: [
      { date: '2024-01-15', score: 7.8 },
      { date: '2024-01-16', score: 8.2 },
      { date: '2024-01-17', score: 8.5 },
      { date: '2024-01-18', score: 8.9 },
      { date: '2024-01-19', score: 8.1 },
      { date: '2024-01-20', score: 7.6 },
      { date: '2024-01-21', score: 8.4 }
    ],
    categoryBreakdown: {
      coding: 60,
      research: 25,
      meeting: 10,
      documentation: 5
    }
  });
  const [goalProgress, setGoalProgress] = useState<GoalProgress>({
    daily: { target: 8, actual: 6.5, percentage: 81.25 },
    weekly: { target: 40, actual: 35, percentage: 87.5 },
    monthly: { target: 160, actual: 142, percentage: 88.75 }
  });
  const [loading, setLoading] = useState(false);

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}h ${minutes}m`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-400" />;
    return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Productivity Analysis</h1>
            <p className="text-white/70 mt-1">AI-powered insights into your work patterns and performance</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Date Selector */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white backdrop-blur-md"
            />
            
            {/* View Toggle */}
            <div className="flex bg-white/10 rounded-lg p-1 border border-white/20">
              {['daily', 'weekly', 'monthly'].map((view) => (
                <button
                  key={view}
                  onClick={() => setSelectedView(view as any)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    selectedView === view
                      ? 'bg-white/20 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Productivity Score */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Zap className="w-5 h-5 text-yellow-400 mr-2" />
                <h3 className="text-sm font-medium text-white/80">Productivity Score</h3>
              </div>
              {getTrendIcon(metrics.trend, metrics.change)}
            </div>
            <div className="flex items-baseline">
              <span className={`text-3xl font-bold ${getScoreColor(metrics.score)}`}>
                {metrics.score}
              </span>
              <span className="text-white/60 ml-1">/10</span>
            </div>
            <p className="text-xs text-white/60 mt-1">
              {metrics.change > 0 ? '+' : ''}{metrics.change} from yesterday
            </p>
          </div>

          {/* Focus Time */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Clock className="w-5 h-5 text-blue-400 mr-2" />
              <h3 className="text-sm font-medium text-white/80">Deep Focus Time</h3>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {formatDuration(metrics.focusTime)}
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full"
                style={{ width: `${(metrics.focusTime / (8 * 60 * 60 * 1000)) * 100}%` }}
              />
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Award className="w-5 h-5 text-green-400 mr-2" />
              <h3 className="text-sm font-medium text-white/80">Tasks Completed</h3>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {metrics.completedTasks}
            </div>
            <p className="text-xs text-white/60">
              Avg session: {formatDuration(metrics.averageSessionLength)}
            </p>
          </div>

          {/* Peak Hours */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-5 h-5 text-purple-400 mr-2" />
              <h3 className="text-sm font-medium text-white/80">Peak Hours</h3>
            </div>
            <div className="space-y-1">
              {metrics.peakHours.map((hour, index) => (
                <div key={index} className="text-sm text-white font-medium">
                  {hour}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="mb-8">
          <ActivityTimelineChart selectedDate={selectedDate} className="w-full" />
        </div>

        {/* Charts and Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weekly Trend */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Weekly Productivity Trend</h3>
              <BarChart3 className="w-5 h-5 text-white/60" />
            </div>
            
            <div className="space-y-3">
              {weeklyStats.dailyScores.map((day, index) => (
                <div key={day.date} className="flex items-center">
                  <div className="w-20 text-sm text-white/60">
                    {new Date(day.date).toLocaleDateString([], { weekday: 'short' })}
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-white/10 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${getScoreColor(day.score).replace('text-', 'bg-')}`}
                        style={{ width: `${(day.score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className={`w-12 text-sm font-medium ${getScoreColor(day.score)} text-right`}>
                    {day.score}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Time Distribution</h3>
              <PieChart className="w-5 h-5 text-white/60" />
            </div>
            
            <div className="space-y-4">
              {Object.entries(weeklyStats.categoryBreakdown).map(([category, percentage]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      category === 'coding' ? 'bg-blue-400' :
                      category === 'research' ? 'bg-green-400' :
                      category === 'meeting' ? 'bg-purple-400' :
                      'bg-orange-400'
                    }`} />
                    <span className="text-white text-sm capitalize">{category}</span>
                  </div>
                  <span className="text-white/80 font-medium">{percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Goal Progress */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Goal Progress</h3>
            <Target className="w-5 h-5 text-white/60" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(goalProgress).map(([period, data]) => (
              <div key={period} className="text-center">
                <div className="text-sm text-white/60 mb-2 capitalize">{period} Goal</div>
                <div className="relative w-24 h-24 mx-auto mb-3">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40 * (data.percentage / 100)} ${2 * Math.PI * 40}`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold">{Math.round(data.percentage)}%</span>
                  </div>
                </div>
                <div className="text-white text-sm">
                  {data.actual}h / {data.target}h
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}