'use client';

import { useState, useEffect } from 'react';
import { Clock, Play, Pause, BookOpen, Code, FileText, Users, Palette, TestTube } from 'lucide-react';

interface TimelineActivity {
  id: string;
  title: string;
  category: 'coding' | 'research' | 'meeting' | 'design' | 'documentation' | 'testing' | 'other';
  start_time: string;
  end_time?: string;
  duration_ms: number;
  project_id?: string;
  project_name?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
}

interface TimelineData {
  activities: TimelineActivity[];
  totalTime: number;
  activeTime: number;
  categories: Record<string, number>;
}

const categoryIcons = {
  coding: Code,
  research: BookOpen,
  meeting: Users,
  design: Palette,
  documentation: FileText,
  testing: TestTube,
  other: Clock
};

const categoryColors = {
  coding: 'text-blue-600 bg-blue-50 border-blue-200',
  research: 'text-green-600 bg-green-50 border-green-200',
  meeting: 'text-purple-600 bg-purple-50 border-purple-200',
  design: 'text-pink-600 bg-pink-50 border-pink-200',
  documentation: 'text-orange-600 bg-orange-50 border-orange-200',
  testing: 'text-red-600 bg-red-50 border-red-200',
  other: 'text-gray-600 bg-gray-50 border-gray-200'
};

interface ActivityTimelineChartProps {
  selectedDate?: string;
  projectId?: string;
  className?: string;
}

export default function ActivityTimelineChart({ 
  selectedDate = new Date().toISOString().split('T')[0], 
  projectId,
  className = '' 
}: ActivityTimelineChartProps) {
  const [timelineData, setTimelineData] = useState<TimelineData>({
    activities: [],
    totalTime: 0,
    activeTime: 0,
    categories: {}
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchTimelineData = async () => {
    try {
      setLoading(true);
      
      // For now, use mock data since the backend integration is not complete
      // TODO: Replace with actual API call when backend is ready
      setTimelineData({
        activities: generateMockActivities(),
        totalTime: 28800000, // 8 hours
        activeTime: 25200000, // 7 hours
        categories: {
          coding: 14400000, // 4 hours
          research: 7200000, // 2 hours
          meeting: 3600000, // 1 hour
          documentation: 1800000, // 30 minutes
          design: 1200000 // 20 minutes
        }
      });
    } catch (error) {
      console.error('Error fetching timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockActivities = (): TimelineActivity[] => {
    const activities: TimelineActivity[] = [];
    const baseDate = new Date(selectedDate);
    let currentTime = new Date(baseDate);
    currentTime.setHours(9, 0, 0, 0);

    const mockData = [
      { category: 'coding', duration: 2 * 60 * 60 * 1000, title: 'Implement timeline component' },
      { category: 'meeting', duration: 30 * 60 * 1000, title: 'Daily standup' },
      { category: 'coding', duration: 1.5 * 60 * 60 * 1000, title: 'Fix chart rendering' },
      { category: 'research', duration: 45 * 60 * 1000, title: 'Research chart libraries' },
      { category: 'documentation', duration: 30 * 60 * 1000, title: 'Update API docs' },
      { category: 'design', duration: 20 * 60 * 1000, title: 'Review UI mockups' }
    ];

    mockData.forEach((item, index) => {
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime.getTime() + item.duration);
      
      activities.push({
        id: `activity-${index}`,
        title: item.title,
        category: item.category as any,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_ms: item.duration,
        project_name: 'Glass Project',
        status: 'completed'
      });

      currentTime.setTime(endTime.getTime() + (15 * 60 * 1000)); // 15 min break
    });

    return activities;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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

  const getTimelinePosition = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const dayStart = new Date(start);
    dayStart.setHours(8, 0, 0, 0);
    const dayEnd = new Date(start);
    dayEnd.setHours(18, 0, 0, 0);

    const totalDayMs = dayEnd.getTime() - dayStart.getTime();
    const startOffset = Math.max(0, start.getTime() - dayStart.getTime());
    const duration = end.getTime() - start.getTime();

    const left = (startOffset / totalDayMs) * 100;
    const width = (duration / totalDayMs) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
  };

  const filteredActivities = selectedCategory 
    ? timelineData.activities.filter(activity => activity.category === selectedCategory)
    : timelineData.activities;

  useEffect(() => {
    fetchTimelineData();
  }, [selectedDate, projectId]);

  if (loading) {
    return (
      <div className={`bg-white border-2 border-gray-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-white/10 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Activity Timeline</h2>
          <p className="text-gray-600 text-sm">
            {new Date(selectedDate).toLocaleDateString()} • {formatDuration(timelineData.totalTime)} total
          </p>
        </div>
        
        {/* Category Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              !selectedCategory 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {Object.entries(timelineData.categories || {}).map(([category, time]) => {
            const IconComponent = categoryIcons[category as keyof typeof categoryIcons];
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  selectedCategory === category 
                    ? 'bg-white/20 text-white' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <IconComponent className="w-3 h-3" />
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline Header */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>8:00 AM</span>
          <span>12:00 PM</span>
          <span>6:00 PM</span>
        </div>
        <div className="h-px bg-gray-300"></div>
      </div>

      {/* Timeline */}
      <div className="space-y-3 mb-6">
        {Array.isArray(filteredActivities) && filteredActivities.map((activity) => {
          const IconComponent = categoryIcons[activity.category];
          const position = getTimelinePosition(activity.start_time, activity.end_time!);
          
          return (
            <div key={activity.id} className="relative">
              {/* Timeline Background */}
              <div className="h-14 bg-gray-50 rounded-xl relative overflow-hidden border border-gray-200">
                {/* Activity Bar */}
                <div
                  className={`absolute top-0 h-full rounded-xl shadow-sm bg-gradient-to-r ${
                    activity.category === 'coding' ? 'from-blue-400 to-blue-500' :
                    activity.category === 'research' ? 'from-green-400 to-green-500' :
                    activity.category === 'meeting' ? 'from-purple-400 to-purple-500' :
                    activity.category === 'design' ? 'from-pink-400 to-pink-500' :
                    activity.category === 'documentation' ? 'from-orange-400 to-orange-500' :
                    activity.category === 'testing' ? 'from-red-400 to-red-500' :
                    'from-gray-400 to-gray-500'
                  }`}
                  style={position}
                >
                  <div className="flex items-center h-full px-3">
                    <IconComponent className="w-4 h-4 text-white mr-2 flex-shrink-0 drop-shadow" />
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-semibold truncate drop-shadow">{activity.title}</p>
                      <p className="text-white/80 text-xs drop-shadow">
                        {formatTime(activity.start_time)} - {formatTime(activity.end_time!)} 
                        <span className="ml-1">({formatDuration(activity.duration_ms)})</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(timelineData.categories).map(([category, time]) => {
          const IconComponent = categoryIcons[category as keyof typeof categoryIcons];
          const percentage = (time / timelineData.totalTime) * 100;
          
          return (
            <div key={category} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border-2 border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center mb-2">
                <IconComponent className="w-5 h-5 text-gray-700 mr-2" />
                <span className="text-gray-900 text-sm font-semibold capitalize">{category}</span>
              </div>
              <div className="text-gray-900 text-xl font-bold">{formatDuration(time)}</div>
              <div className="text-gray-500 text-xs font-medium">{percentage.toFixed(1)}% of day</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}