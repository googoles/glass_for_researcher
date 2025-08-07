'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRedirectIfNotAuth } from '@/utils/auth'
import {
  UserProfile,
  Activity,
  getActivities
} from '@/utils/api'
import { Download, AlertCircle } from 'lucide-react'
import { getEnvironmentFeatures, isElectronEnvironmentAsync, debugEnvironmentDetection } from '@/utils/environment'


export default function ActivityPage() {
  const userInfo = useRedirectIfNotAuth() as UserProfile | null;
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [environmentFeatures, setEnvironmentFeatures] = useState(getEnvironmentFeatures())
  const [envCheckComplete, setEnvCheckComplete] = useState(false)

  const fetchActivities = async () => {
    try {
      const result = await getActivities({ limit: 50 });
      // Ensure we always set an array even if the response is malformed
      setActivities(Array.isArray(result.activities) ? result.activities : []);
    } catch (error) {
      console.error('Failed to fetch activities:', error)
      // Set empty array on error to prevent UI breaking
      setActivities([]);
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  // Additional environment check for Electron context
  useEffect(() => {
    const checkEnvironment = async () => {
      try {
        // Debug current environment detection
        debugEnvironmentDetection();
        
        // Double-check with async method
        const isElectronAsync = await isElectronEnvironmentAsync();
        const currentFeatures = getEnvironmentFeatures();
        
        console.log('Environment check results:', {
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
        }
        
        setEnvCheckComplete(true);
      } catch (error) {
        console.warn('Environment check failed:', error);
        setEnvCheckComplete(true);
      }
    };
    
    checkEnvironment();
  }, [])


  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner h-8 w-8 mx-auto"></div>
          <p className="mt-3 text-gray-600 text-sm">Loading...</p>
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
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-medium text-gray-900 mb-2">
            {getGreeting()}, {userInfo.display_name}
          </h1>
          <p className="text-gray-600 text-sm">Here's your recent activity</p>
        </div>
        <div>
          {isLoading ? (
            <div className="text-center py-16">
              <div className="spinner h-6 w-6 mx-auto"></div>
              <p className="mt-3 text-gray-500 text-sm">Loading activities...</p>
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="card-hover p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Link 
                      href={`/activity/details?activityId=${activity.id}`} 
                      className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {activity.title || `Activity - ${activity.category}`}
                    </Link>
                    <div className="text-xs text-gray-500">
                      {activity.category}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                      {activity.status === 'completed' ? 'Completed' : activity.status === 'active' ? 'Active' : 'Activity'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              {!envCheckComplete ? (
                <div className="space-y-4">
                  <div className="spinner h-6 w-6 mx-auto"></div>
                  <p className="text-gray-500 text-sm">Checking environment...</p>
                </div>
              ) : environmentFeatures.isWeb ? (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center justify-center space-x-2 text-amber-700 mb-1">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Desktop App Required</span>
                    </div>
                    <p className="text-amber-600 text-xs">
                      Activity tracking is only available in the desktop application.
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-600 text-sm mb-3">
                      Download the desktop app to start tracking your sessions.
                    </p>
                    <Link 
                      href="/download" 
                      className="btn btn-primary gap-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download App</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 text-sm mb-2">
                    No activities yet. Use the desktop app to start tracking.
                  </p>
                  <p className="text-xs text-gray-400">
                    Activities will appear here automatically.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 