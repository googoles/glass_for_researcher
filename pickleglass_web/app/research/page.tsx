'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, BookOpen, Clock, Calendar, FileText } from 'lucide-react';

interface ResearchSession {
  id: string;
  session_type: string;
  title: string;
  start_time: string;
  end_time?: string;
  duration_ms: number;
  metadata?: any;
}

interface DailyStats {
  total_sessions: number;
  total_time_ms: number;
  avg_session_length_ms: number;
  unique_pdfs: number;
}

interface ResearchStatus {
  isTracking: boolean;
  currentSession?: ResearchSession;
}

export default function ResearchPage() {
  const [status, setStatus] = useState<ResearchStatus | null>(null);
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [dashboardRes] = await Promise.all([
        fetch('/api/research/dashboard')
      ]);

      if (!dashboardRes.ok) {
        throw new Error('Failed to fetch research data');
      }

      const dashboardData = await dashboardRes.json();

      // Extract data from dashboard response
      setStatus({
        isTracking: dashboardData.currentSession !== null,
        currentSession: dashboardData.currentSession
      });
      setSessions(dashboardData.recentSessions || []);
      setDailyStats(dashboardData.dailyStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleTracking = async () => {
    try {
      const endpoint = status?.isTracking ? '/api/research/stop' : '/api/research/start';
      const response = await fetch(endpoint, { method: 'POST' });
      
      if (!response.ok) {
        throw new Error('Failed to toggle tracking');
      }
      
      await fetchData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle tracking');
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-3 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Research Tracking</h1>
            <p className="text-gray-600 mt-1">Track your PDF reading sessions and research progress</p>
          </div>
          
          {status && (
            <button
              onClick={toggleTracking}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                status.isTracking
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {status.isTracking ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Tracking
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Tracking
                </>
              )}
            </button>
          )}
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Current Session */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h3 className="ml-2 text-sm font-medium text-blue-800">Current Session</h3>
            </div>
            <div className="mt-2">
              {status?.currentSession ? (
                <>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatDuration(Date.now() - new Date(status.currentSession.start_time).getTime())}
                  </p>
                  <p className="text-sm text-blue-600 truncate">{status.currentSession.title}</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-blue-900">—</p>
                  <p className="text-sm text-blue-600">No active session</p>
                </>
              )}
            </div>
          </div>

          {/* Today's Reading */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-green-600" />
              <h3 className="ml-2 text-sm font-medium text-green-800">Today's Reading</h3>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-green-900">
                {dailyStats ? formatDuration(dailyStats.total_time_ms) : '—'}
              </p>
              <p className="text-sm text-green-600">
                {dailyStats ? `${dailyStats.total_sessions} sessions` : 'No data'}
              </p>
            </div>
          </div>

          {/* PDFs Read Today */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-purple-600" />
              <h3 className="ml-2 text-sm font-medium text-purple-800">PDFs Read</h3>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-purple-900">
                {dailyStats?.unique_pdfs || 0}
              </p>
              <p className="text-sm text-purple-600">Today</p>
            </div>
          </div>

          {/* Average Session */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-orange-600" />
              <h3 className="ml-2 text-sm font-medium text-orange-800">Avg Session</h3>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-orange-900">
                {dailyStats ? formatDuration(dailyStats.avg_session_length_ms) : '—'}
              </p>
              <p className="text-sm text-orange-600">Length</p>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Sessions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h2>
            <div className="space-y-3">
              {sessions.length > 0 ? (
                sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 truncate">{session.title}</p>
                      <p className="text-sm text-gray-500">
                        {formatTime(session.start_time)} • {formatDuration(session.duration_ms)}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(session.start_time)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No recent sessions</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}