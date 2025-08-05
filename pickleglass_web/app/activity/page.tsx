'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRedirectIfNotAuth } from '@/utils/auth'
import {
  UserProfile,
  Session,
  getSessions,
  deleteSession
} from '@/utils/api'
import { Trash2, Download, AlertCircle } from 'lucide-react'
import { getEnvironmentFeatures } from '@/utils/environment'


export default function ActivityPage() {
  const userInfo = useRedirectIfNotAuth() as UserProfile | null;
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [environmentFeatures] = useState(getEnvironmentFeatures())

  const fetchSessions = async () => {
    try {
      const fetchedSessions = await getSessions();
      // Ensure we always set an array even if the response is malformed
      setSessions(Array.isArray(fetchedSessions) ? fetchedSessions : []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
      // Set empty array on error to prevent UI breaking
      setSessions([]);
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
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

  const handleDelete = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this session? This cannot be undone.')) return;
    setDeletingId(sessionId);
    try {
      await deleteSession(sessionId);
      setSessions(sessions => sessions.filter(s => s.id !== sessionId));
    } catch (error) {
      alert('Failed to delete session.');
      console.error(error);
    } finally {
      setDeletingId(null);
    }
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
              <p className="mt-3 text-gray-500 text-sm">Loading sessions...</p>
            </div>
          ) : sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="card-hover p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Link 
                      href={`/activity/details?sessionId=${session.id}`} 
                      className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {session.title || `Session - ${new Date(session.started_at * 1000).toLocaleDateString()}`}
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleDelete(session.id)
                      }}
                      disabled={deletingId === session.id}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete session"
                    >
                      {deletingId === session.id ? (
                        <div className="spinner h-3 w-3"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                      {session.session_type === 'ask' ? 'Ask' : session.session_type === 'listen' ? 'Listen' : 'Session'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(session.started_at * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              {environmentFeatures.isWeb ? (
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
                    No sessions yet. Use the desktop app to start tracking.
                  </p>
                  <p className="text-xs text-gray-400">
                    Sessions will appear here automatically.
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