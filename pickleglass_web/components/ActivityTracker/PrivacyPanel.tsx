'use client'

import { useState } from 'react'
import { Shield, Eye, Lock, Download, Trash2, Settings, ChevronDown, CheckCircle } from 'lucide-react'

interface PrivacyPanelProps {
  isExpanded: boolean
  onToggle: () => void
  className?: string
}

interface PrivacySetting {
  id: string
  title: string
  description: string
  icon: typeof Shield
  status: 'secure' | 'private' | 'encrypted'
  enabled: boolean
}

export default function PrivacyPanel({
  isExpanded,
  onToggle,
  className = ''
}: PrivacyPanelProps) {
  const [settings, setSettings] = useState<PrivacySetting[]>([
    {
      id: 'screenshot-storage',
      title: 'Screenshot Storage',
      description: 'Screenshots are encrypted and stored locally on your device',
      icon: Eye,
      status: 'encrypted',
      enabled: true
    },
    {
      id: 'ai-processing',
      title: 'AI Processing',
      description: 'Analysis happens locally when possible, minimizing cloud processing',
      icon: Shield,
      status: 'private',
      enabled: true
    },
    {
      id: 'data-sync',
      title: 'Data Synchronization',
      description: 'Optional cloud sync with end-to-end encryption',
      icon: Lock,
      status: 'secure',
      enabled: false
    }
  ])

  const statusConfig = {
    secure: {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      label: 'Secure'
    },
    private: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      label: 'Private'
    },
    encrypted: {
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      label: 'Encrypted'
    }
  }

  const handleExportData = async () => {
    // In real implementation, this would export user data
    alert('Data export will be available in the next update')
  }

  const handleDeleteAllData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete all your activity data? This action cannot be undone.'
    )
    if (confirmed) {
      // In real implementation, this would delete all user data
      alert('Data deletion will be available in the next update')
    }
  }

  const toggleSetting = (id: string) => {
    setSettings(prev => prev.map(setting => 
      setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
    ))
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>
      <div className="p-6 border-b border-gray-100">
        <button
          onClick={onToggle}
          className="flex items-center justify-between w-full text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Privacy & Data Control</h3>
              <p className="text-sm text-gray-600">Manage how your data is stored and processed</p>
            </div>
          </div>
          <ChevronDown 
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6 animate-fade-in">
          {/* Privacy Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
              Data Protection
            </h4>
            
            {settings.map(setting => {
              const IconComponent = setting.icon
              const statusStyle = statusConfig[setting.status]
              
              return (
                <div key={setting.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <IconComponent className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="font-medium text-gray-900">{setting.title}</h5>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bgColor} ${statusStyle.color}`}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {statusStyle.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{setting.description}</p>
                    </div>
                  </div>
                  
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={setting.enabled}
                      onChange={() => toggleSetting(setting.id)}
                      className="sr-only"
                    />
                    <div className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${setting.enabled ? 'bg-blue-600' : 'bg-gray-200'}
                    `}>
                      <span className={`
                        inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform
                        ${setting.enabled ? 'translate-x-6' : 'translate-x-1'}
                      `} />
                    </div>
                  </label>
                </div>
              )
            })}
          </div>

          {/* Data Controls */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
              Data Management
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleExportData}
                className="
                  flex items-center justify-center space-x-2 px-4 py-3 
                  bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 
                  transition-colors duration-200 font-medium text-sm
                "
              >
                <Download className="h-4 w-4" />
                <span>Export My Data</span>
              </button>
              
              <button
                onClick={handleDeleteAllData}
                className="
                  flex items-center justify-center space-x-2 px-4 py-3 
                  bg-red-50 text-red-700 rounded-lg hover:bg-red-100 
                  transition-colors duration-200 font-medium text-sm
                "
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete All Data</span>
              </button>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start space-x-3">
              <Settings className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-gray-700 font-medium mb-1">Your Privacy is Our Priority</p>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Glass is designed with privacy-first principles. Your screenshots and activity data 
                  never leave your device unless you explicitly choose cloud sync. AI processing 
                  happens locally whenever possible, and all cloud communications are encrypted.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}