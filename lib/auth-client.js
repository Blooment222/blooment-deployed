'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Protect admin routes
  useEffect(() => {
    if (!loading && !user && pathname?.startsWith('/admin') && pathname !== '/admin/login') {
      router.push('/admin/login')
    }
  }, [user, loading, pathname, router])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      
      if (!token) {
        setLoading(false)
        return
      }

      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        localStorage.removeItem('admin_token')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('admin_token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('admin_token', data.token)
        setUser(data.user)
        router.push('/admin')
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    setUser(null)
    router.push('/admin/login')
  }

  const getToken = () => {
    return localStorage.getItem('admin_token')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
