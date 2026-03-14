'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WelcomeSplash } from '@/components/WelcomeSplash'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const hasProcessed = useRef(false)
  const [showSplash, setShowSplash] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return
    hasProcessed.current = true

    const processGoogleAuth = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = window.location.hash
        const sessionIdMatch = hash.match(/session_id=([^&]+)/)
        
        if (!sessionIdMatch) {
          console.error('❌ No session_id found in URL')
          router.push('/tienda/login?error=auth_failed')
          return
        }

        const sessionId = sessionIdMatch[1]
        console.log('🔑 Processing Google OAuth session...')

        // Exchange session_id for user data via backend
        const response = await fetch('/api/auth/google/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ session_id: sessionId }),
          credentials: 'include' // Important for cookies
        })

        if (!response.ok) {
          const error = await response.json()
          console.error('❌ Auth callback failed:', error)
          router.push('/tienda/login?error=auth_failed')
          return
        }

        const data = await response.json()
        console.log('✅ Google auth successful, showing splash...')
        
        // Mostrar splash de bienvenida
        setUserName(data.user?.nombre || 'Usuario')
        setShowSplash(true)
        
      } catch (error) {
        console.error('❌ Error processing Google auth:', error)
        router.push('/tienda/login?error=auth_failed')
      }
    }

    processGoogleAuth()
  }, [router])

  const handleSplashComplete = () => {
    setShowSplash(false)
    router.push('/tienda')
  }

  if (showSplash) {
    return <WelcomeSplash userName={userName} onComplete={handleSplashComplete} />
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="w-12 h-12 animate-spin text-[#F5B6C6]" />
      <p className="mt-4 text-gray-600">Completando inicio de sesión con Google...</p>
    </div>
  )
}
