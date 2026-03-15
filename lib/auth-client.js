'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const AuthContext = createContext({})

// Lista de superadmins (siempre tienen todos los permisos)
const SUPERADMIN_EMAILS = [
  'diegoah1107@gmail.com',
  'maireyesguevara@gmail.com'
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth()
    
    // Auto-logout cuando se cierra la pestaña/navegador
    const handleBeforeUnload = () => {
      // Marcar que la sesión debe verificarse al volver
      sessionStorage.setItem('session_active', 'true')
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // Protect admin routes
  useEffect(() => {
    if (!loading && !user && pathname?.startsWith('/admin') && pathname !== '/admin/login') {
      router.push('/admin/login')
    }
  }, [user, loading, pathname, router])

  const checkAuth = async () => {
    try {
      // Usar sessionStorage para que expire al cerrar pestaña
      const token = sessionStorage.getItem('admin_token')
      
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
        // Verificar si es superadmin por email
        const isSuperAdmin = SUPERADMIN_EMAILS.includes(data.user.email?.toLowerCase())
        
        // Asegurar permisos correctos para superadmins
        const userData = {
          ...data.user,
          rol: isSuperAdmin ? 'superadmin' : (data.user.rol || 'colaborador'),
          permisos: isSuperAdmin 
            ? JSON.stringify({ dashboard: true, productos: true, pedidos: true, clientes: true, cupones: true, finanzas: true, seguridad: true })
            : data.user.permisos
        }
        
        setUser(userData)
      } else {
        sessionStorage.removeItem('admin_token')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      sessionStorage.removeItem('admin_token')
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
        // Usar sessionStorage para auto-logout al cerrar pestaña
        sessionStorage.setItem('admin_token', data.token)
        
        // Verificar si es superadmin por email
        const isSuperAdmin = SUPERADMIN_EMAILS.includes(data.user.email?.toLowerCase())
        
        const userData = {
          ...data.user,
          rol: isSuperAdmin ? 'superadmin' : (data.user.rol || 'colaborador'),
          permisos: isSuperAdmin 
            ? JSON.stringify({ dashboard: true, productos: true, pedidos: true, clientes: true, cupones: true, finanzas: true, seguridad: true })
            : data.user.permisos
        }
        
        setUser(userData)
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
    sessionStorage.removeItem('admin_token')
    setUser(null)
    router.push('/admin/login')
  }

  const getToken = () => {
    return sessionStorage.getItem('admin_token')
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
