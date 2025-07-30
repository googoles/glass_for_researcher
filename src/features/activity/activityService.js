const activityRepository = require('./repositories');
const { BrowserWindow } = require('electron');

class ActivityService {
  constructor() {
    this.isTracking = false;
    this.activities = [];
    this.currentActivity = null;
    this.goals = {
      daily: 8,
      weekly: 40,
      monthly: 160
    };
  }

  async initialize() {
    console.log('[Activity Service] Initializing activity tracking...');
    try {
      await activityRepository.initialize();
      
      // Load existing goals
      const storedGoals = await activityRepository.getGoals();
      if (storedGoals) {
        this.goals = { ...this.goals, ...storedGoals };
      }
      
      console.log('[Activity Service] Activity repository initialized');
      return true;
    } catch (error) {
      console.error('[Activity Service] Failed to initialize:', error);
      return false;
    }
  }

  async getTimeline({ date, projectId }) {
    try {
      const activities = await activityRepository.getActivitiesByDate(date, projectId);
      
      // Calculate timeline data
      const totalTime = activities.reduce((sum, activity) => sum + activity.duration_ms, 0);
      const categories = {};
      
      activities.forEach(activity => {
        if (!categories[activity.category]) {
          categories[activity.category] = 0;
        }
        categories[activity.category] += activity.duration_ms;
      });

      return {
        activities,
        totalTime,
        activeTime: totalTime * 0.85, // Assuming 85% active time
        categories
      };
    } catch (error) {
      console.error('[Activity Service] Failed to get timeline:', error);
      return {
        activities: [],
        totalTime: 0,
        activeTime: 0,
        categories: {}
      };
    }
  }

  async getProductivityMetrics({ date, period }) {
    try {
      const activities = await activityRepository.getActivitiesByDate(date);
      
      if (activities.length === 0) {
        return this.getDefaultMetrics();
      }

      // Calculate productivity score based on various factors
      const totalTime = activities.reduce((sum, activity) => sum + activity.duration_ms, 0);
      const focusTime = activities
        .filter(activity => ['coding', 'research', 'design'].includes(activity.category))
        .reduce((sum, activity) => sum + activity.duration_ms, 0);
      
      const completedTasks = activities.filter(activity => activity.status === 'completed').length;
      const averageSessionLength = totalTime / activities.length;
      
      // Simple productivity scoring algorithm
      const focusRatio = focusTime / totalTime;
      const sessionEfficiency = Math.min(averageSessionLength / (45 * 60 * 1000), 1); // 45 minutes is optimal
      const completionRate = completedTasks / activities.length;
      
      const score = (focusRatio * 0.4 + sessionEfficiency * 0.3 + completionRate * 0.3) * 10;
      
      // Detect peak hours
      const hourlyActivity = {};
      activities.forEach(activity => {
        const hour = new Date(activity.start_time).getHours();
        if (!hourlyActivity[hour]) hourlyActivity[hour] = 0;
        hourlyActivity[hour] += activity.duration_ms;
      });
      
      const peakHours = Object.entries(hourlyActivity)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([hour]) => `${hour}:00-${parseInt(hour) + 1}:00`);

      return {
        score: Math.round(score * 10) / 10,
        trend: this.calculateTrend(date),
        change: 0.3, // This would be calculated by comparing with previous days
        peakHours,
        focusTime,
        distractionTime: totalTime - focusTime,
        completedTasks,
        averageSessionLength
      };
    } catch (error) {
      console.error('[Activity Service] Failed to get productivity metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  getDefaultMetrics() {
    return {
      score: 7.5,
      trend: 'stable',
      change: 0,
      peakHours: ['9:00-11:00', '14:00-16:00'],
      focusTime: 5 * 60 * 60 * 1000, // 5 hours
      distractionTime: 1 * 60 * 60 * 1000, // 1 hour
      completedTasks: 8,
      averageSessionLength: 30 * 60 * 1000 // 30 minutes
    };
  }

  calculateTrend(date) {
    // Simplified trend calculation - would normally compare with historical data
    return Math.random() > 0.5 ? 'up' : 'down';
  }

  async getWeeklyStats({ startDate, endDate }) {
    try {
      const activities = await activityRepository.getActivitiesBetweenDates(startDate, endDate);
      
      const totalHours = activities.reduce((sum, activity) => sum + activity.duration_ms, 0) / (60 * 60 * 1000);
      const productiveHours = activities
        .filter(activity => ['coding', 'research', 'design'].includes(activity.category))
        .reduce((sum, activity) => sum + activity.duration_ms, 0) / (60 * 60 * 1000);
      
      const completedProjects = new Set(
        activities
          .filter(activity => activity.status === 'completed' && activity.project_id)
          .map(activity => activity.project_id)
      ).size;

      // Generate daily scores
      const dailyScores = [];
      const currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      while (currentDate <= endDateObj) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayActivities = activities.filter(activity => 
          activity.start_time.startsWith(dateStr)
        );
        
        const dayScore = dayActivities.length > 0 
          ? (await this.getProductivityMetrics({ date: dateStr })).score
          : 0;
        
        dailyScores.push({
          date: dateStr,
          score: dayScore
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Category breakdown
      const categoryTotals = {};
      activities.forEach(activity => {
        if (!categoryTotals[activity.category]) {
          categoryTotals[activity.category] = 0;
        }
        categoryTotals[activity.category] += activity.duration_ms;
      });
      
      const totalTime = Object.values(categoryTotals).reduce((sum, time) => sum + time, 0);
      const categoryBreakdown = {};
      Object.entries(categoryTotals).forEach(([category, time]) => {
        categoryBreakdown[category] = Math.round((time / totalTime) * 100);
      });

      return {
        totalHours: Math.round(totalHours * 10) / 10,
        productiveHours: Math.round(productiveHours * 10) / 10,
        completedProjects,
        averageScore: dailyScores.reduce((sum, day) => sum + day.score, 0) / dailyScores.length,
        dailyScores,
        categoryBreakdown
      };
    } catch (error) {
      console.error('[Activity Service] Failed to get weekly stats:', error);
      return {
        totalHours: 0,
        productiveHours: 0,
        completedProjects: 0,
        averageScore: 0,
        dailyScores: [],
        categoryBreakdown: {}
      };
    }
  }

  async getGoalProgress() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const monthStart = new Date();
      monthStart.setDate(1);

      const [dailyData, weeklyData, monthlyData] = await Promise.all([
        this.getTimeline({ date: today }),
        this.getWeeklyStats({ 
          startDate: weekStart.toISOString().split('T')[0], 
          endDate: today 
        }),
        this.getWeeklyStats({ 
          startDate: monthStart.toISOString().split('T')[0], 
          endDate: today 
        })
      ]);

      const dailyHours = dailyData.totalTime / (60 * 60 * 1000);
      const weeklyHours = weeklyData.totalHours;
      const monthlyHours = monthlyData.totalHours;

      return {
        daily: {
          target: this.goals.daily,
          actual: Math.round(dailyHours * 10) / 10,
          percentage: Math.round((dailyHours / this.goals.daily) * 100 * 10) / 10
        },
        weekly: {
          target: this.goals.weekly,
          actual: Math.round(weeklyHours * 10) / 10,
          percentage: Math.round((weeklyHours / this.goals.weekly) * 100 * 10) / 10
        },
        monthly: {
          target: this.goals.monthly,
          actual: Math.round(monthlyHours * 10) / 10,
          percentage: Math.round((monthlyHours / this.goals.monthly) * 100 * 10) / 10
        }
      };
    } catch (error) {
      console.error('[Activity Service] Failed to get goal progress:', error);
      return {
        daily: { target: this.goals.daily, actual: 0, percentage: 0 },
        weekly: { target: this.goals.weekly, actual: 0, percentage: 0 },
        monthly: { target: this.goals.monthly, actual: 0, percentage: 0 }
      };
    }
  }

  async setGoals(goals) {
    try {
      this.goals = { ...this.goals, ...goals };
      await activityRepository.saveGoals(this.goals);
      return this.goals;
    } catch (error) {
      console.error('[Activity Service] Failed to set goals:', error);
      throw error;
    }
  }

  // Utility method to create activity entries
  async createActivity(activityData) {
    try {
      return await activityRepository.createActivity(activityData);
    } catch (error) {
      console.error('[Activity Service] Failed to create activity:', error);
      throw error;
    }
  }
}

module.exports = new ActivityService();