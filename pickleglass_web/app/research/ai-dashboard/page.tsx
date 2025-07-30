'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProductivityScore {
  score: number | null;
  timestamp: number;
  confidence: number;
  analysis: string;
}

interface AnalysisHistoryItem {
  timestamp: number;
  productivity_score: number;
  activity_type: string;
  applications: string[];
  focus_quality: string;
  confidence_score: number;
}

interface ProductivityStats {
  total_analyses: number;
  avg_productivity: number;
  max_productivity: number;
  min_productivity: number;
  avg_confidence: number;
}

interface AIStatus {
  enabled: boolean;
  analysisHistory: number;
  screenshotHistory: number;
  lastAnalysis: number | null;
}

interface Insights {
  timeframe: string;
  dataPoints: number;
  patterns?: any;
  insights?: any;
  generatedAt: number;
  error?: string;
}

export default function AIDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for AI analysis data
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [currentScore, setCurrentScore] = useState<ProductivityScore | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([]);
  const [productivityStats, setProductivityStats] = useState<ProductivityStats | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

  // Fetch AI status
  const fetchAIStatus = async () => {
    try {
      const response = await fetch('/api/research/ai-status');
      const data = await response.json();
      setAiStatus(data);
    } catch (err) {
      console.error('Failed to fetch AI status:', err);
    }
  };

  // Fetch current productivity score
  const fetchCurrentScore = async () => {
    try {
      const response = await fetch('/api/research/analysis/current-score');
      const data = await response.json();
      setCurrentScore(data);
    } catch (err) {
      console.error('Failed to fetch current score:', err);
    }
  };

  // Fetch analysis history
  const fetchAnalysisHistory = async () => {
    try {
      const response = await fetch('/api/research/analysis/history?limit=50');
      const data = await response.json();
      setAnalysisHistory(data);
    } catch (err) {
      console.error('Failed to fetch analysis history:', err);
    }
  };

  // Fetch productivity stats
  const fetchProductivityStats = async (timeframe: string) => {
    try {
      const response = await fetch(`/api/research/analysis/productivity-stats/${timeframe}`);
      const data = await response.json();
      setProductivityStats(data);
    } catch (err) {
      console.error('Failed to fetch productivity stats:', err);
    }
  };

  // Fetch insights
  const fetchInsights = async (timeframe: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/research/insights/${timeframe}`);
      const data = await response.json();
      setInsights(data);
    } catch (err) {
      console.error('Failed to fetch insights:', err);
      setError('Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  // Trigger manual analysis
  const triggerManualAnalysis = async () => {
    try {
      const response = await fetch('/api/research/analysis/manual-capture', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        // Refresh current data
        await fetchCurrentScore();
        await fetchAnalysisHistory();
      } else {
        setError(result.error || 'Manual analysis failed');
      }
    } catch (err) {
      console.error('Manual analysis failed:', err);
      setError('Manual analysis failed');
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchAIStatus(),
          fetchCurrentScore(),
          fetchAnalysisHistory(),
          fetchProductivityStats(selectedTimeframe),
          fetchInsights(selectedTimeframe)
        ]);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update data when timeframe changes
  useEffect(() => {
    fetchProductivityStats(selectedTimeframe);
    fetchInsights(selectedTimeframe);
  }, [selectedTimeframe]);

  // Auto-refresh current score every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (aiStatus?.enabled) {
        fetchCurrentScore();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [aiStatus]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    if (score >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-600">Loading AI dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!aiStatus?.enabled) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Analysis Dashboard</h1>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">AI Analysis Not Available</h3>
              <p className="text-yellow-700 mb-4">
                AI analysis requires a valid API key for Gemini or OpenAI. Please configure your API keys in settings to enable advanced productivity insights.
              </p>
              <button
                onClick={() => router.push('/settings')}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
              >
                Configure API Keys
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Analysis Dashboard</h1>
          <p className="text-gray-600">
            Advanced productivity insights powered by AI analysis of your work patterns
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* AI Status and Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">AI Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Analyses:</span>
                <span className="font-medium">{aiStatus?.analysisHistory || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Analysis:</span>
                <span className="font-medium">
                  {aiStatus?.lastAnalysis ? 
                    new Date(aiStatus.lastAnalysis).toLocaleTimeString() : 'None'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Productivity</h3>
            {currentScore?.score !== null ? (
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(currentScore!.score!)}`}>
                  {currentScore!.score!.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {getScoreLabel(currentScore!.score!)}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {currentScore?.analysis || 'No analysis available'}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                No current analysis available
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={triggerManualAnalysis}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Analyze Now
              </button>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1h">Last Hour</option>
                <option value="4h">Last 4 Hours</option>
                <option value="12h">Last 12 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Productivity Statistics */}
        {productivityStats && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Productivity Statistics ({selectedTimeframe})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {productivityStats.total_analyses}
                </div>
                <div className="text-sm text-gray-600">Total Analyses</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(productivityStats.avg_productivity)}`}>
                  {productivityStats.avg_productivity.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {productivityStats.max_productivity.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Peak Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {productivityStats.min_productivity.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Lowest Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(productivityStats.avg_confidence * 100)}%
                </div>
                <div className="text-sm text-gray-600">Confidence</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Analysis History */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Analysis History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Focus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applications
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analysisHistory.slice(0, 10).map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getScoreColor(item.productivity_score)}`}>
                        {item.productivity_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.activity_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.focus_quality}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.applications?.slice(0, 2).join(', ') || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Insights */}
        {insights && !insights.error && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              AI Insights ({insights.timeframe})
            </h3>
            <div className="text-sm text-gray-600 mb-4">
              Based on {insights.dataPoints} data points
            </div>
            
            {insights.insights?.personalizedRecommendations && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Personalized Recommendations</h4>
                <ul className="space-y-2">
                  {insights.insights.personalizedRecommendations.slice(0, 5).map((rec: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insights.patterns?.aiAnalysis && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Pattern Analysis</h4>
                <div className="text-gray-700 text-sm whitespace-pre-wrap">
                  {insights.patterns.aiAnalysis.substring(0, 500)}...
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Generated at {new Date(insights.generatedAt).toLocaleString()}
            </div>
          </div>
        )}

        {insights?.error && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">AI Insights</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <p className="text-yellow-700">{insights.error}</p>
              <p className="text-sm text-yellow-600 mt-2">
                Continue using the system to collect more data for meaningful insights.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}