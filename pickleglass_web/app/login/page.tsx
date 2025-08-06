'use client'

import { useRouter } from 'next/navigation'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/utils/firebase'
import { Chrome } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isElectronMode, setIsElectronMode] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const mode = urlParams.get('mode')
    setIsElectronMode(mode === 'electron')
  }, [])

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider()
    setIsLoading(true)
    
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      
      if (user) {
        console.log('✅ Google login successful:', user.uid)

        if (isElectronMode) {
          try {
            const idToken = await user.getIdToken()
            
            const deepLinkUrl = `pickleglass://auth-success?` + new URLSearchParams({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              token: idToken
            }).toString()
            
            console.log('🔗 Return to electron app via deep link:', deepLinkUrl)
            
            window.location.href = deepLinkUrl
            
            // Maybe we don't need this
            // setTimeout(() => {
            //   alert('Login completed. Please return to Pickle Glass app.')
            // }, 1000)
            
          } catch (error) {
            console.error('❌ Deep link processing failed:', error)
            alert('Login was successful but failed to return to app. Please check the app.')
          }
        } 
        else if (typeof window !== 'undefined' && window.require) {
          try {
            const { ipcRenderer } = window.require('electron')
            const idToken = await user.getIdToken()
            
            ipcRenderer.send('firebase-auth-success', {
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
              idToken
            })
            
            console.log('📡 Auth info sent to electron successfully')
          } catch (error) {
            console.error('❌ Electron communication failed:', error)
          }
        } 
        else {
          router.push('/settings')
        }
      }
    } catch (error: any) {
      console.error('❌ Google login failed:', error)
      
      if (error.code !== 'auth/popup-closed-by-user') {
        alert('An error occurred during login. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Glass</h1>
          <p className="text-gray-600 text-sm">Sign in to sync your data across devices</p>
          {isElectronMode && (
            <p className="text-xs text-blue-600 mt-1">Login requested from desktop app</p>
          )}
        </div>
        
        <div className="card p-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="btn btn-secondary w-full gap-3 py-3"
          >
            {isLoading ? (
              <div className="spinner h-4 w-4"></div>
            ) : (
              <Chrome className="h-4 w-4" />
            )}
            <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                if (isElectronMode) {
                  window.location.href = 'pickleglass://auth-success?uid=default_user&email=contact@pickle.com&displayName=Default%20User'
                } else {
                  router.push('/settings')
                }
              }}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Continue in local mode
            </button>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-400 mt-4">
          By signing in, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  )
} 