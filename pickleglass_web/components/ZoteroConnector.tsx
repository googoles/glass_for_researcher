'use client'

import { useState, useEffect } from 'react'
import { Database, BookOpen, Download, Upload, RefreshCw, CheckCircle, AlertCircle, FileText, Loader2, Settings } from 'lucide-react'

interface ZoteroItem {
  key: string
  title: string
  creators: Array<{ firstName: string; lastName: string }>
  date: string
  itemType: string
  attachments?: Array<{
    key: string
    title: string
    contentType: string
    url?: string
  }>
  abstract?: string
  tags?: Array<{ tag: string }>
  url?: string
  DOI?: string
}

interface ZoteroConnectorProps {
  onPaperSelected?: (paper: ZoteroItem) => void
}

export default function ZoteroConnector({ onPaperSelected }: ZoteroConnectorProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [papers, setPapers] = useState<ZoteroItem[]>([])
  const [selectedPaper, setSelectedPaper] = useState<ZoteroItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [userID, setUserID] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  // Load saved credentials securely
  useEffect(() => {
    loadSecureCredentials()
  }, [])

  const loadSecureCredentials = async () => {
    try {
      const response = await fetch('/api/credentials/zotero/for-api')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.credentials) {
          setApiKey(data.credentials.apiKey)
          setUserID(data.credentials.zoteroUserId)
          setIsConnected(true)
        }
      }
    } catch (error) {
      console.warn('Could not load secure credentials:', error)
      // Fallback to localStorage for development/testing
      const savedKey = localStorage.getItem('zotero_api_key')
      const savedID = localStorage.getItem('zotero_user_id')
      if (savedKey && savedID) {
        setApiKey(savedKey)
        setUserID(savedID)
        setIsConnected(true)
      }
    }
  }

  const connectToZotero = async () => {
    if (!apiKey || !userID) {
      setError('Please enter both API Key and User ID')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Test the connection
      const response = await fetch(
        `https://api.zotero.org/users/${userID}/items?limit=1`,
        {
          headers: {
            'Zotero-API-Key': apiKey,
            'Zotero-API-Version': '3'
          }
        }
      )

      if (response.ok) {
        // Store credentials securely
        try {
          const storeResponse = await fetch('/api/credentials/zotero', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              apiKey,
              zoteroUserId: userID
            })
          })
          
          if (storeResponse.ok) {
            console.log('Credentials stored securely')
          } else {
            console.warn('Failed to store credentials securely, using localStorage fallback')
            localStorage.setItem('zotero_api_key', apiKey)
            localStorage.setItem('zotero_user_id', userID)
          }
        } catch (error) {
          console.warn('Secure storage failed, using localStorage fallback:', error)
          localStorage.setItem('zotero_api_key', apiKey)
          localStorage.setItem('zotero_user_id', userID)
        }
        
        setIsConnected(true)
        setShowSettings(false)
        await loadPapers()
      } else {
        setError('Failed to connect. Please check your credentials.')
      }
    } catch (err) {
      setError('Connection error. Please check your internet connection.')
    } finally {
      setIsConnecting(false)
    }
  }

  const loadPapers = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `https://api.zotero.org/users/${userID}/items?itemType=journalArticle&limit=50&sort=dateModified&direction=desc`,
        {
          headers: {
            'Zotero-API-Key': apiKey,
            'Zotero-API-Version': '3'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        const formattedPapers = data.map((item: any) => ({
          key: item.key,
          title: item.data.title || 'Untitled',
          creators: item.data.creators || [],
          date: item.data.date || '',
          itemType: item.data.itemType,
          attachments: item.data.attachments || [],
          abstract: item.data.abstractNote,
          tags: item.data.tags || [],
          url: item.data.url,
          DOI: item.data.DOI
        }))
        setPapers(formattedPapers)
      } else {
        setError('Failed to load papers')
      }
    } catch (err) {
      setError('Error loading papers')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaperSelect = (paper: ZoteroItem) => {
    setSelectedPaper(paper)
    if (onPaperSelected) {
      onPaperSelected(paper)
    }
  }

  const disconnectFromZotero = async () => {
    try {
      // Remove credentials securely
      const response = await fetch('/api/credentials/zotero', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        console.log('Credentials removed securely')
      } else {
        console.warn('Failed to remove credentials securely, clearing localStorage')
      }
    } catch (error) {
      console.warn('Secure removal failed, clearing localStorage:', error)
    }
    
    // Clear localStorage as fallback
    localStorage.removeItem('zotero_api_key')
    localStorage.removeItem('zotero_user_id')
    
    // Reset state
    setApiKey('')
    setUserID('')
    setIsConnected(false)
    setPapers([])
    setSelectedPaper(null)
    setError(null)
  }


  if (!isConnected || showSettings) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Database className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Zotero Connection</h3>
              <p className="text-sm text-gray-600">Connect to your Zotero library</p>
            </div>
          </div>
          {isConnected && (
            <button
              onClick={() => setShowSettings(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zotero User ID
            </label>
            <input
              type="text"
              value={userID}
              onChange={(e) => setUserID(e.target.value)}
              placeholder="Enter your Zotero User ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Find your User ID in Zotero Settings → Feeds/API
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Zotero API Key"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Generate an API key at zotero.org/settings/keys
            </p>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={connectToZotero}
            disabled={isConnecting || !apiKey || !userID}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                <span>Connect to Zotero</span>
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Database className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Zotero Library</h3>
            <p className="text-sm text-gray-600">
              {papers.length} papers available
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadPapers}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
            title="Refresh papers"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            onClick={disconnectFromZotero}
            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Disconnect from Zotero"
          >
            Disconnect
          </button>
        </div>
      </div>

      {selectedPaper && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">Selected Paper</h4>
              <p className="text-sm text-gray-700">{selectedPaper.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedPaper.creators.map(c => `${c.firstName} ${c.lastName}`).join(', ')}
              </p>
            </div>
            <button
              onClick={() => setSelectedPaper(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading papers...</p>
          </div>
        ) : papers.length > 0 ? (
          papers.map((paper) => (
            <div
              key={paper.key}
              onClick={() => handlePaperSelect(paper)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedPaper?.key === paper.key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                    {paper.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-1">
                    {paper.creators.slice(0, 3).map(c => `${c.firstName} ${c.lastName}`).join(', ')}
                    {paper.creators.length > 3 && ' et al.'}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{paper.date}</span>
                    {paper.tags && paper.tags.length > 0 && (
                      <span>{paper.tags.slice(0, 3).map(t => t.tag).join(', ')}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No papers found</p>
            <p className="text-sm text-gray-400 mt-1">
              Add papers to your Zotero library to see them here
            </p>
          </div>
        )}
      </div>
    </div>
  )
}