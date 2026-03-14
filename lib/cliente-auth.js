'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const ClienteAuthContext = createContext({})

export function ClienteAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is authenticated on mount (non-blocking)
  useEffect(() => {
    // Ejecutar checkAuth de forma no bloqueante
    const timeoutId = setTimeout(() => {
      checkAuth()
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('cliente_token')
      
      if (!token) {
        setLoading(false)
        return
      }

      // Fetch en background sin bloquear UI
      const res = await fetch('/api/clientes/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        // Solo limpiar token si es 401 (no autorizado)
        if (res.status === 401) {
          console.log('⚠️ Token inválido, limpiando sesión')
          localStorage.removeItem('cliente_token')
          setUser(null)
        }
      }
    } catch (error) {
      // NO limpiar el token en caso de error de red
      console.error('Auth check failed (network error):', error)
      // Mantener el token para reintentar después
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (nombre, email, password, telefono, direccion) => {
    try {
      const res = await fetch('/api/clientes/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password, telefono, direccion })
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('cliente_token', data.token)
        setUser(data.user)
        return { success: true, user: data.user }
      } else {
        return { success: false, error: data.error || 'Registro fallido' }
      }
    } catch (error) {
      return { success: false, error: 'Error de red' }
    }
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const res = await fetch('/api/clientes/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('cliente_token', data.token)
        setUser(data.user)
        return { success: true, user: data.user }
      } else {
        return { success: false, error: data.error || 'Login fallido' }
      }
    } catch (error) {
      return { success: false, error: 'Error de red' }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('cliente_token')
    setUser(null)
  }, [])

  const getToken = useCallback(() => {
    return localStorage.getItem('cliente_token')
  }, [])

  const updateProfile = useCallback(async (data) => {
    try {
      const token = getToken()
      const res = await fetch('/api/clientes/me', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      const responseData = await res.json()

      if (res.ok) {
        setUser(responseData)
        return { success: true, user: responseData }
      } else {
        return { success: false, error: responseData.error || 'Error al actualizar perfil' }
      }
    } catch (error) {
      return { success: false, error: 'Error de red' }
    }
  }, [getToken])

  // Memoizar el value del context
  const contextValue = useMemo(() => ({ 
    user, 
    loading, 
    register, 
    login, 
    logout, 
    getToken,
    updateProfile,
    checkAuth
  }), [user, loading, register, login, logout, getToken, updateProfile, checkAuth])

  return (
    <ClienteAuthContext.Provider value={contextValue}>
      {children}
    </ClienteAuthContext.Provider>
  )
}

export function useClienteAuth() {
  return useContext(ClienteAuthContext)
}
