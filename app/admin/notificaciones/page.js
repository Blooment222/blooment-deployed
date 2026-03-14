'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Bell, Send, Users, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'
import { useAuth } from '@/lib/auth-client'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'

export default function NotificacionesAdmin() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  const [formData, setFormData] = useState({
    titulo: '',
    mensaje: '',
    url: ''
  })

  const { getToken } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchUsuariosConPush()
  }, [])

  const fetchUsuariosConPush = async () => {
    setLoading(true)
    try {
      const token = getToken()
      const res = await fetch('/api/admin/notificaciones/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.ok) {
        const data = await res.json()
        setUsuarios(data.usuarios || [])
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los usuarios',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.titulo || !formData.mensaje) {
      toast({
        title: 'Error',
        description: 'Título y mensaje son obligatorios',
        variant: 'destructive'
      })
      return
    }

    setShowConfirmation(true)
  }

  const enviarNotificacion = async () => {
    setSending(true)
    setShowConfirmation(false)

    try {
      const token = getToken()
      const res = await fetch('/api/admin/notificaciones/enviar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: '¡Notificación enviada!',
          description: `Se envió correctamente a ${data.recipients || '?'} usuarios`,
        })
        
        // Limpiar formulario
        setFormData({ titulo: '', mensaje: '', url: '' })
      } else {
        throw new Error(data.error || 'Error enviando notificación')
      }
    } catch (error) {
      console.error('Error enviando notificación:', error)
      toast({
        title: 'Error',
        description: error.message || 'No se pudo enviar la notificación',
        variant: 'destructive'
      })
    } finally {
      setSending(false)
    }
  }

  const usuariosConPush = usuarios.filter(u => u.push_enabled)
  const porcentajeSuscritos = usuarios.length > 0 
    ? Math.round((usuariosConPush.length / usuarios.length) * 100) 
    : 0

  return (
    <div className="p-6 space-y-6">
      <Toaster />
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Bell className="h-8 w-8 text-[#F5B6C6]" />
          Notificaciones Push
        </h1>
        <p className="text-gray-600 mt-1">
          Envía campañas de marketing y ofertas a tus clientes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{usuarios.length}</p>
                <p className="text-sm text-gray-600">Total Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{usuariosConPush.length}</p>
                <p className="text-sm text-gray-600">Con Notificaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#F5B6C6]/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-[#F5B6C6]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{porcentajeSuscritos}%</p>
                <p className="text-sm text-gray-600">Tasa de Suscripción</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulario de Campaña */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-[#F5B6C6]" />
            Nueva Campaña de Marketing
          </CardTitle>
          <CardDescription>
            Crea y envía una notificación push a todos tus clientes suscritos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Título */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Título *
              </label>
              <Input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ej: ¡Promo de Primavera! 🌸"
                className="border-gray-300 focus:border-[#F5B6C6] focus:ring-[#F5B6C6]"
                required
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.titulo.length}/50 caracteres
              </p>
            </div>

            {/* Mensaje */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Mensaje *
              </label>
              <Textarea
                value={formData.mensaje}
                onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                placeholder="Ej: 20% de descuento en todos los tulipanes hoy. ¡No te lo pierdas!"
                className="border-gray-300 focus:border-[#F5B6C6] focus:ring-[#F5B6C6] min-h-[100px]"
                required
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.mensaje.length}/200 caracteres
              </p>
            </div>

            {/* URL (Opcional) */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Enlace (Opcional)
              </label>
              <Input
                type="text"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="Ej: /tienda o https://..."
                className="border-gray-300 focus:border-[#F5B6C6] focus:ring-[#F5B6C6]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Página a la que se redirige al tocar la notificación
              </p>
            </div>

            {/* Preview */}
            {(formData.titulo || formData.mensaje) && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 mb-2 font-semibold">Vista Previa:</p>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#F5B6C6] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">
                        {formData.titulo || 'Título de la notificación'}
                      </p>
                      <p className="text-gray-700 text-xs mt-0.5 line-clamp-2">
                        {formData.mensaje || 'Mensaje de la notificación'}
                      </p>
                      {formData.url && (
                        <p className="text-[#F5B6C6] text-xs mt-1">
                          🔗 {formData.url}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advertencia si no hay usuarios */}
            {usuariosConPush.length === 0 && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-800 text-sm">
                    No hay usuarios con notificaciones activadas
                  </p>
                  <p className="text-yellow-700 text-xs mt-1">
                    Invita a tus clientes a activar las notificaciones push desde la app
                  </p>
                </div>
              </div>
            )}

            {/* Botón de Enviar */}
            <Button
              type="submit"
              disabled={sending || usuariosConPush.length === 0}
              className="w-full bg-[#F5B6C6] hover:bg-[#F5B6C6]/90 text-white font-semibold h-12 text-base"
            >
              {sending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Enviar a {usuariosConPush.length} usuarios
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Modal de Confirmación */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                ¿Confirmar envío?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700">
                Estás a punto de enviar esta notificación a <strong>{usuariosConPush.length} usuarios</strong>. Esta acción no se puede deshacer.
              </p>
              
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-semibold text-gray-900">{formData.titulo}</p>
                <p className="text-gray-700 mt-1">{formData.mensaje}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={enviarNotificacion}
                  disabled={sending}
                  className="flex-1 bg-[#F5B6C6] hover:bg-[#F5B6C6]/90"
                >
                  Sí, enviar ahora
                </Button>
                <Button
                  onClick={() => setShowConfirmation(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={sending}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
