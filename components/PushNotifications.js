'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Bell, X } from 'lucide-react'

/**
 * Componente para solicitar permisos de notificaciones push
 * Se debe mostrar en momentos clave (después de primera compra o registro)
 */
export function PushNotificationPrompt({ onAccept, onDecline, show = false }) {
  const [isVisible, setIsVisible] = useState(show)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsVisible(show)
  }, [show])

  const handleAccept = async () => {
    setIsLoading(true)
    try {
      await onAccept()
    } finally {
      setIsLoading(false)
      setIsVisible(false)
    }
  }

  const handleDecline = () => {
    if (onDecline) onDecline()
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <CardContent className="pt-6 pb-6">
          <button
            onClick={handleDecline}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center text-center space-y-4">
            {/* Ícono */}
            <div className="w-16 h-16 bg-[#F5B6C6]/10 rounded-full flex items-center justify-center">
              <Bell className="h-8 w-8 text-[#F5B6C6]" />
            </div>

            {/* Título */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ¡No te pierdas nada! 🌸
              </h3>
              <p className="text-gray-600 text-sm">
                Activa las notificaciones para saber cuándo lleguen tus flores y recibir ofertas exclusivas
              </p>
            </div>

            {/* Beneficios */}
            <div className="w-full text-left space-y-2 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-green-600 text-lg">✓</span>
                <span className="text-sm text-gray-700">Seguimiento en tiempo real de tus pedidos</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 text-lg">✓</span>
                <span className="text-sm text-gray-700">Ofertas y descuentos exclusivos</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 text-lg">✓</span>
                <span className="text-sm text-gray-700">Recordatorios de fechas especiales</span>
              </div>
            </div>

            {/* Botones */}
            <div className="w-full space-y-2 pt-2">
              <Button
                onClick={handleAccept}
                disabled={isLoading}
                className="w-full bg-[#F5B6C6] hover:bg-[#F5B6C6]/90 text-white font-semibold h-12"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Activando...
                  </span>
                ) : (
                  'Activar Notificaciones'
                )}
              </Button>
              <Button
                onClick={handleDecline}
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-900"
              >
                Ahora no
              </Button>
            </div>

            <p className="text-xs text-gray-400 pt-2">
              Puedes cambiar esta configuración en cualquier momento
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Hook para gestionar las notificaciones push con OneSignal
 */
export function usePushNotifications() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [playerId, setPlayerId] = useState(null)

  useEffect(() => {
    initOneSignal()
  }, [])

  const initOneSignal = async () => {
    if (typeof window === 'undefined') return

    // Verificar si OneSignal está configurado
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    if (!appId) {
      console.warn('⚠️ NEXT_PUBLIC_ONESIGNAL_APP_ID no está configurado')
      return
    }

    try {
      // Cargar script de OneSignal si no está cargado
      if (!window.OneSignalDeferred) {
        const script = document.createElement('script')
        script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
        script.defer = true
        document.head.appendChild(script)

        await new Promise((resolve) => {
          script.onload = resolve
        })
      }

      // Inicializar OneSignal
      window.OneSignalDeferred = window.OneSignalDeferred || []
      window.OneSignalDeferred.push(async function(OneSignal) {
        await OneSignal.init({
          appId: appId,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: false // Usamos nuestro propio UI
          }
        })

        // Verificar si ya está suscrito
        const isPushEnabled = await OneSignal.User.PushSubscription.optedIn
        setIsSubscribed(isPushEnabled)

        if (isPushEnabled) {
          const id = await OneSignal.User.PushSubscription.id
          setPlayerId(id)
        }

        setIsInitialized(true)
        console.log('✅ OneSignal inicializado')
      })
    } catch (error) {
      console.error('❌ Error inicializando OneSignal:', error)
    }
  }

  const requestPermission = async () => {
    if (!isInitialized || !window.OneSignal) {
      console.error('❌ OneSignal no está inicializado')
      return { success: false, error: 'OneSignal not initialized' }
    }

    try {
      // Solicitar permiso y suscribirse
      await window.OneSignal.Slidedown.promptPush()
      
      // Esperar a que el usuario acepte
      const isPushEnabled = await window.OneSignal.User.PushSubscription.optedIn
      
      if (isPushEnabled) {
        const id = await window.OneSignal.User.PushSubscription.id
        setIsSubscribed(true)
        setPlayerId(id)
        
        console.log('✅ Usuario suscrito a notificaciones. Player ID:', id)
        return { success: true, playerId: id }
      } else {
        console.log('⚠️ Usuario rechazó los permisos')
        return { success: false, error: 'Permission denied' }
      }
    } catch (error) {
      console.error('❌ Error solicitando permisos:', error)
      return { success: false, error: error.message }
    }
  }

  const savePushToken = async (token) => {
    try {
      const clienteToken = localStorage.getItem('cliente_token')
      if (!clienteToken) {
        console.error('❌ No hay sesión de cliente')
        return { success: false, error: 'No session' }
      }

      const response = await fetch('/api/clientes/push-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clienteToken}`
        },
        body: JSON.stringify({ push_token: token })
      })

      if (!response.ok) {
        throw new Error('Error guardando token')
      }

      console.log('✅ Push token guardado en base de datos')
      return { success: true }
    } catch (error) {
      console.error('❌ Error guardando push token:', error)
      return { success: false, error: error.message }
    }
  }

  return {
    isInitialized,
    isSubscribed,
    playerId,
    requestPermission,
    savePushToken
  }
}
