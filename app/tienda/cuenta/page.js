'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'
import { useClienteAuth } from '@/lib/cliente-auth'
import { useRouter } from 'next/navigation'
import { TiendaLayoutWrapper } from '@/components/TiendaLayoutWrapper'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { 
  Package, User as UserIcon, Mail, Phone, MapPin, Edit, 
  CheckCircle2, Scissors, Truck, Gift, Heart, LogOut, Plus, Trash2, Users, HelpCircle, Calendar, X 
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatCurrency } from '@/lib/currency'

import { MapboxAutocomplete } from '@/components/MapboxAutocomplete'

// Componente de Línea de Seguimiento Animada
function OrderTimeline({ estado }) {
  const steps = [
    { id: 'pendiente', label: 'Pedido Recibido', icon: CheckCircle2, description: 'Tu pedido ha sido confirmado' },
    { id: 'en_preparacion', label: 'En Preparación', icon: Scissors, description: 'Estamos preparando tu arreglo' },
    { id: 'enviado', label: 'En Camino', icon: Truck, description: 'Tu pedido está en camino' },
    { id: 'entregado', label: 'Entregado', icon: Heart, description: 'Pedido entregado con éxito' }
  ]

  const currentStepIndex = steps.findIndex(step => step.id === estado)
  const activeIndex = currentStepIndex !== -1 ? currentStepIndex : 0

  return (
    <div className="py-6 px-2 sm:px-6 w-full">
      <div className="relative max-w-full mx-auto">
        {/* Línea de fondo */}
        <div className="absolute top-6 sm:top-7 left-[12%] right-[12%] h-0.5 sm:h-1 bg-gray-200"></div>
        {/* Línea de progreso */}
        <div 
          className="absolute top-6 sm:top-7 left-[12%] h-0.5 sm:h-1 bg-[#F5B6C6] transition-all duration-700 ease-in-out" 
          style={{ width: `${(activeIndex / (steps.length - 1)) * 76}%` }}
        ></div>

        <div className="relative flex justify-between items-start gap-1 sm:gap-2">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            const isCompleted = index < activeIndex
            const isCurrent = index === activeIndex
            const isFuture = index > activeIndex
            
            return (
              <div key={step.id} className="flex flex-col items-center flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className={`
                    w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border-3 sm:border-4 transition-all duration-500 relative z-10
                    ${isCompleted ? 'bg-[#F5B6C6] border-[#F5B6C6] shadow-lg' : ''}
                    ${isCurrent ? 'bg-[#F5B6C6] border-[#F5B6C6] shadow-xl animate-pulse' : ''}
                    ${isFuture ? 'bg-white border-gray-200' : ''}
                  `}>
                    <StepIcon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 transition-colors duration-500 ${isCompleted || isCurrent ? 'text-white' : 'text-gray-300'}`} />
                  </div>
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-[#F5B6C6] opacity-20 animate-ping"></div>
                  )}
                </div>
                <div className="mt-2 sm:mt-3 text-center w-full px-0.5">
                  <p className={`text-[10px] sm:text-xs font-semibold leading-tight break-words ${isCompleted || isCurrent ? 'text-[#F5B6C6]' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function CuentaContent() {
  const { user, getToken, logout, loading: authLoading } = useClienteAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pedidos, setPedidos] = useState([])
  const [contactos, setContactos] = useState([])
  const [editando, setEditando] = useState(false)
  const [formData, setFormData] = useState({ nombre: '', telefono: '', direccion: '' })
  
  // Estado para modal de contacto
  const [modalContacto, setModalContacto] = useState(false)
  const [contactoEditando, setContactoEditando] = useState(null)
  const [direccionSeleccionada, setDireccionSeleccionada] = useState(false)
  const [formContacto, setFormContacto] = useState({ 
    nombre: '', 
    telefono: '', 
    direccion: '',
    coordenadas: null, // { lat, lng }
    fecha_especial: '', 
    motivo: '' 
  })

  // Estado para modal de editar pedido
  const [modalEditarPedido, setModalEditarPedido] = useState(false)
  const [pedidoEditando, setPedidoEditando] = useState(null)
  const [puedeReprogramar, setPuedeReprogramar] = useState(false)
  const [cambiarTelefono, setCambiarTelefono] = useState(false) // NUEVO: para controlar si cambia teléfono
  const [formPedido, setFormPedido] = useState({
    nombre_destinatario: '',
    tel_destinatario: '',
    horario_entrega: '',
    dedicatoria: ''
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/tienda/login')
    }
  }, [user, authLoading, router])

  // Optimización: usar useCallback para evitar recrear las funciones en cada render
  const fetchPedidos = useCallback(async () => {
    if (!user) return
    
    try {
      const token = getToken()
      const response = await fetch('/api/pedidos/cliente/mis-pedidos', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setPedidos(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [user, getToken])

  const fetchContactos = useCallback(async () => {
    if (!user) return
    
    try {
      const token = getToken()
      const response = await fetch('/api/contactos-favoritos', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setContactos(data.contactos || data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }, [user, getToken])

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        telefono: user.telefono || '',
        direccion: user.direccion || ''
      })
      // Mostrar UI inmediatamente sin esperar a que los datos carguen
      setLoading(false)
      // Cargar datos en paralelo para mejorar performance
      Promise.all([fetchPedidos(), fetchContactos()]).catch(console.error)
    }
  }, [user, fetchPedidos, fetchContactos])

  const handleSavePerfil = async (e) => {
    e.preventDefault()
    try {
      const token = getToken()
      const response = await fetch('/api/clientes/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Perfil actualizado exitosamente')
        setEditando(false)
        window.location.reload()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar perfil')
    }
  }

  const handleSaveContacto = async (e) => {
    e.preventDefault()
    try {
      const token = getToken()
      const url = contactoEditando 
        ? `/api/contactos-favoritos/${contactoEditando.id}`
        : '/api/contactos-favoritos'
      
      const response = await fetch(url, {
        method: contactoEditando ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formContacto)
      })

      if (response.ok) {
        alert(contactoEditando ? 'Contacto actualizado' : 'Contacto agregado')
        setModalContacto(false)
        setContactoEditando(null)
        setFormContacto({ nombre: '', telefono: '', direccion: '', coordenadas: null, fecha_especial: '', motivo: '' })
        fetchContactos()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar contacto')
    }
  }

  const handleDeleteContacto = async (id) => {
    if (confirm('¿Eliminar este contacto?')) {
      try {
        const token = getToken()
        const response = await fetch(`/api/contactos-favoritos/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          alert('Contacto eliminado')
          fetchContactos()
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }
  }

  const handleDeletePedido = async (pedidoId) => {
    if (confirm('¿Estás seguro de que deseas eliminar este pedido de tu historial? Esta acción no se puede deshacer.')) {
      try {
        const token = getToken()
        const response = await fetch(`/api/pedidos/${pedidoId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          alert('Pedido eliminado exitosamente de tu historial')
          setPedidos(pedidos.filter(p => p.id !== pedidoId))
        } else {
          const errorData = await response.json()
          alert('Error al eliminar el pedido: ' + errorData.error)
        }
      } catch (error) {
        console.error('Error:', error)
        alert('Error al eliminar el pedido')
      }
    }
  }

  const handleCancelarPedido = async (pedidoId) => {
    if (confirm('¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer.')) {
      try {
        const token = getToken()
        const response = await fetch(`/api/pedidos/${pedidoId}/cancelar`, {
          method: 'PUT', // Corregido de POST a PUT
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          alert('Pedido cancelado exitosamente')
          // Actualizar el estado del pedido en el estado local
          setPedidos(pedidos.map(p => 
            p.id === pedidoId ? { ...p, estado: 'cancelado', updatedAt: new Date().toISOString() } : p
          ))
        } else {
          const errorData = await response.json()
          alert('Error al cancelar el pedido: ' + errorData.error)
        }
      } catch (error) {
        console.error('Error:', error)
        alert('Error al cancelar el pedido')
      }
    }
  }

  const handleEditarPedido = (pedido) => {
    // Calcular si faltan más de 4 horas para la entrega
    const ahora = new Date()
    
    // Nota: Asumiendo que la entrega es el mismo día del pedido
    // Si el pedido tiene una fecha de entrega específica, usar esa
    // Por ahora, usar la fecha del pedido más el horario de entrega
    let fechaEntrega = new Date(pedido.fecha || pedido.createdAt)
    
    // Extraer la hora de inicio del horario (ej: "10:00-13:00" -> "10:00")
    if (pedido.horario_entrega) {
      const horaInicio = pedido.horario_entrega.split('-')[0].trim()
      const [hora, minuto] = horaInicio.split(':').map(Number)
      fechaEntrega.setHours(hora, minuto, 0, 0)
    }
    
    // Calcular diferencia en horas
    const horasDiferencia = (fechaEntrega - ahora) / (1000 * 60 * 60)
    
    console.log('🕐 Validación de tiempo:', {
      ahora: ahora.toLocaleString(),
      fechaEntrega: fechaEntrega.toLocaleString(),
      horasDiferencia: horasDiferencia.toFixed(2),
      puedeReprogramar: horasDiferencia > 4
    })
    
    const puedeReprogramarFecha = horasDiferencia > 4
    
    // Abrir modal con los datos del pedido
    setPedidoEditando(pedido)
    setPuedeReprogramar(puedeReprogramarFecha)
    setCambiarTelefono(false) // Resetear la opción de cambiar teléfono
    setFormPedido({
      nombre_destinatario: pedido.nombre_destinatario || '',
      tel_destinatario: pedido.tel_destinatario || '',
      horario_entrega: pedido.horario_entrega || '',
      dedicatoria: pedido.dedicatoria || ''
    })
    setModalEditarPedido(true)
  }

  const handleGuardarPedido = async (e) => {
    e.preventDefault()
    
    // Validar campos requeridos
    if (!formPedido.nombre_destinatario) {
      alert('Por favor completa el nombre del destinatario')
      return
    }
    
    // Si el usuario eligió cambiar el teléfono, validar que lo haya ingresado
    if (cambiarTelefono && !formPedido.tel_destinatario) {
      alert('Por favor ingresa el nuevo número de teléfono')
      return
    }

    try {
      const token = getToken()
      
      // Preparar datos para enviar - SOLO los campos que realmente necesitamos actualizar
      const datosActualizacion = {
        nombre_destinatario: formPedido.nombre_destinatario,
        tel_destinatario: cambiarTelefono ? formPedido.tel_destinatario : pedidoEditando.tel_destinatario, // Usar el original si no cambió
        horario_entrega: formPedido.horario_entrega,
        dedicatoria: formPedido.dedicatoria || ''
      }
      
      // Preparar datos de cambios para el email
      const cambios = {
        pedidoId: pedidoEditando.id,
        cambiosRealizados: {
          nombre_destinatario: {
            anterior: pedidoEditando.nombre_destinatario,
            nuevo: datosActualizacion.nombre_destinatario
          },
          tel_destinatario: {
            anterior: pedidoEditando.tel_destinatario,
            nuevo: datosActualizacion.tel_destinatario
          },
          horario_entrega: {
            anterior: pedidoEditando.horario_entrega,
            nuevo: datosActualizacion.horario_entrega
          },
          dedicatoria: {
            anterior: pedidoEditando.dedicatoria,
            nuevo: datosActualizacion.dedicatoria
          }
        }
      }
      
      console.log('📤 Enviando actualización de pedido:', {
        pedidoId: pedidoEditando.id,
        datos: datosActualizacion
      })
      
      const response = await fetch(`/api/pedidos/cliente/${pedidoEditando.id}/actualizar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...datosActualizacion,
          notificar_admin: true, // Flag para enviar email al admin
          cambios: cambios
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Pedido actualizado exitosamente:', data)
        alert('Pedido actualizado exitosamente. Se ha notificado al equipo de Blooment.')
        
        // Actualizar el pedido en el estado local
        setPedidos(pedidos.map(p => 
          p.id === pedidoEditando.id ? { ...p, ...datosActualizacion } : p
        ))
        
        // Cerrar modal
        setModalEditarPedido(false)
        setPedidoEditando(null)
        setCambiarTelefono(false)
      } else {
        const errorData = await response.json()
        console.error('❌ Error del servidor:', errorData)
        alert('Error al actualizar el pedido: ' + (errorData.error || 'Error desconocido'))
      }
    } catch (error) {
      console.error('❌ Error en la petición:', error)
      alert('Error al actualizar el pedido. Por favor intenta de nuevo.')
    }
  }

  if (authLoading || !user) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Skeleton para perfil */}
        <Card className="shadow-lg rounded-2xl border-[#F5B6C6]/30">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-5/6" />
          </CardContent>
        </Card>
        
        {/* Skeleton para contactos */}
        <Card className="shadow-lg rounded-2xl border-[#F5B6C6]/30">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
        
        {/* Skeleton para pedidos */}
        <Card className="shadow-lg rounded-2xl border-[#F5B6C6]/30">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Filtrar pedidos por estado
  const pedidosActivos = pedidos.filter(p => ['pendiente', 'en_preparacion', 'enviado'].includes(p.estado))
  const pedidosCompletados = pedidos.filter(p => p.estado === 'entregado')
  const pedidosCancelados = pedidos.filter(p => p.estado === 'cancelado')

  const renderPedidoCard = (pedido) => (
    <Card key={pedido.id} className="border-[#F5B6C6]/30 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-pink-50 to-white border-b border-[#F5B6C6]/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[#F5B6C6] text-lg">
              Pedido #{pedido.id.slice(0, 8).toUpperCase()}
            </h3>
            <p className="text-sm text-gray-500">
              {format(new Date(pedido.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-xl font-bold text-[#F5B6C6]">{formatCurrency(pedido.total)}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="bg-white pt-4">
        {pedido.estado === 'cancelado' ? (
          <div className="py-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <Badge variant="outline" className="px-4 py-2 border-2 border-gray-300 text-gray-600 bg-gray-50">
                Pedido Cancelado
              </Badge>
              <div className="text-center">
                <p className="text-gray-600 font-medium">Este pedido ha sido cancelado</p>
                <p className="text-sm text-gray-500 mt-1">
                  {format(new Date(pedido.updatedAt), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 w-full">
                <Button
                  variant="outline"
                  className="w-full border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-full font-semibold"
                  onClick={() => handleDeletePedido(pedido.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Pedido
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <OrderTimeline estado={pedido.estado} />
            
            {/* Botones de Acción - Solo para pedidos activos */}
            {['pendiente', 'en_preparacion'].includes(pedido.estado) && (
              <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
                {/* Botón Editar Pedido */}
                <Button
                  onClick={() => handleEditarPedido(pedido)}
                  className="flex-1 bg-[#F5B6C6] hover:bg-[#F5B6C6]/90 text-white rounded-full font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Pedido
                </Button>
                
                {/* Botón Cancelar Pedido */}
                <Button
                  onClick={() => handleCancelarPedido(pedido.id)}
                  variant="outline"
                  className="flex-1 border-2 border-[#F5B6C6] text-[#F5B6C6] hover:bg-red-50 hover:border-red-400 hover:text-red-600 rounded-full font-semibold transition-all duration-200"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 pb-24">
      {/* Perfil del Usuario */}
      <Card className="shadow-lg rounded-2xl border-[#F5B6C6]/30">
        <CardHeader className="bg-gradient-to-r from-[#F5B6C6]/10 to-white border-b border-[#F5B6C6]/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-[#F5B6C6] flex items-center gap-2">
              <UserIcon className="h-6 w-6" />
              Mi Perfil
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => setEditando(!editando)}
              className="border-[#F5B6C6] text-[#F5B6C6] hover:bg-[#F5B6C6] hover:text-white rounded-full"
            >
              <Edit className="w-4 h-4 mr-2" />
              {editando ? 'Cancelar' : 'Editar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {editando ? (
            <form onSubmit={handleSavePerfil} className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full border-gray-200 focus:border-[#F5B6C6] rounded-lg"
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full border-gray-200 focus:border-[#F5B6C6] rounded-lg"
                />
              </div>
              <div>
                <Label>Dirección</Label>
                <Textarea
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full border-gray-200 focus:border-[#F5B6C6] rounded-lg"
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full bg-[#F5B6C6] hover:bg-[#F5B6C6]/90 text-white rounded-full">
                Guardar Cambios
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#F5B6C6] mt-0.5" />
                <div>
                  <span className="text-sm font-semibold text-black">Email:</span>
                  <p className="text-[#F5B6C6] font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserIcon className="w-5 h-5 text-[#F5B6C6] mt-0.5" />
                <div>
                  <span className="text-sm font-semibold text-black">Nombre:</span>
                  <p className="text-[#F5B6C6] font-medium">{user.nombre}</p>
                </div>
              </div>
              {user.telefono && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#F5B6C6] mt-0.5" />
                  <div>
                    <span className="text-sm font-semibold text-black">Teléfono:</span>
                    <p className="text-[#F5B6C6] font-medium">{user.telefono}</p>
                  </div>
                </div>
              )}
              {user.direccion && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#F5B6C6] mt-0.5" />
                  <div>
                    <span className="text-sm font-semibold text-black">Dirección:</span>
                    <p className="text-[#F5B6C6] font-medium">{user.direccion}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mis Contactos Favoritos */}
      <Card className="shadow-lg rounded-2xl border-[#F5B6C6]/30">
        <CardHeader className="bg-gradient-to-r from-[#F5B6C6]/10 to-white border-b border-[#F5B6C6]/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-[#F5B6C6] flex items-center gap-2">
              <Users className="h-6 w-6" />
              Mis Contactos Favoritos
            </CardTitle>
            <Button
              onClick={() => {
                setContactoEditando(null)
                setFormContacto({ nombre: '', telefono: '', direccion: '', coordenadas: null, fecha_especial: '', motivo: '' })
                setDireccionSeleccionada(false)
                setModalContacto(true)
              }}
              className="bg-[#F5B6C6] hover:bg-[#F5B6C6]/90 text-white rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {contactos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No tienes contactos guardados</p>
              <p className="text-sm mt-1">Agrega contactos frecuentes para comprar más rápido</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {contactos.map((contacto) => (
                <Card key={contacto.id} className="border-gray-200 hover:border-[#F5B6C6]/50 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-[#F5B6C6]">{contacto.nombre}</h4>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setContactoEditando(contacto)
                            setFormContacto(contacto)
                            setDireccionSeleccionada(!!contacto.direccion)
                            setModalContacto(true)
                          }}
                          className="text-[#F5B6C6] hover:bg-[#F5B6C6]/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteContacto(contacto.id)}
                          className="text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#F5B6C6]" />
                        {contacto.telefono}
                      </p>
                      <p className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[#F5B6C6] mt-0.5" />
                        <span className="flex-1">{contacto.direccion}</span>
                      </p>
                      {contacto.fecha_especial && (
                        <div className="pt-2 mt-2 border-t border-[#F5B6C6]/20">
                          <p className="flex items-center gap-2 text-[#F5B6C6] font-medium">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(contacto.fecha_especial), "d 'de' MMMM", { locale: es })}
                          </p>
                          {contacto.motivo && (
                            <p className="text-xs text-gray-500 ml-6 mt-0.5">{contacto.motivo}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Contacto - TELETRANSPORTADO CON REACT PORTAL */}
      {modalContacto && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 w-screen h-[100dvh] bg-black/50 z-[9999] m-0 p-0"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => {
            setModalContacto(false)
            setDireccionSeleccionada(false)
          }}
        >
          <Card 
            className="w-full max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden relative bg-white"
            style={{ maxWidth: '28rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="bg-[#F5B6C6]/10">
              <CardTitle className="text-black font-bold">
                {contactoEditando ? 'Editar Contacto' : 'Nuevo Contacto'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-6">
              <form onSubmit={handleSaveContacto} className="space-y-4">
                {/* NOMBRE */}
                <div className="w-full">
                  <Label className="text-black font-semibold block mb-1">Nombre</Label>
                  <Input
                    value={formContacto.nombre}
                    onChange={(e) => setFormContacto({ ...formContacto, nombre: e.target.value })}
                    required
                    className="w-full min-w-0 box-border rounded-lg"
                  />
                </div>
                
                {/* TELÉFONO */}
                <div className="w-full">
                  <Label className="text-black font-semibold block mb-1">Teléfono</Label>
                  <Input
                    value={formContacto.telefono}
                    onChange={(e) => setFormContacto({ ...formContacto, telefono: e.target.value })}
                    required
                    className="w-full min-w-0 box-border rounded-lg"
                  />
                </div>
                
                {/* DIRECCIÓN */}
                <div className="w-full">
                  <Label className="text-black font-semibold block mb-1">Dirección</Label>
                  <MapboxAutocomplete
                    value={formContacto.direccion}
                    onChange={(value) => {
                      setFormContacto({ ...formContacto, direccion: value })
                    }}
                    onAddressSelect={(addressData) => {
                      setFormContacto({ 
                        ...formContacto, 
                        direccion: addressData.fullAddress,
                        coordenadas: {
                          lat: addressData.latitude,
                          lng: addressData.longitude
                        }
                      })
                      setDireccionSeleccionada(true)
                    }}
                    placeholder="Ej: Av. Insurgentes Sur 1234, Col. Del Valle, CDMX"
                    className="w-full"
                  />
                </div>
                
                {/* FECHA ESPECIAL - CONTENCIÓN ESTRICTA CON APPEARANCE-NONE + INLINE STYLES */}
                <div className="w-full overflow-hidden">
                  <Label className="text-black font-semibold block mb-1 text-sm">
                    Fecha Especial (Opcional)
                  </Label>
                  <Input
                    type="date"
                    value={formContacto.fecha_especial}
                    onChange={(e) => setFormContacto({ ...formContacto, fecha_especial: e.target.value })}
                    className="w-full min-w-0 box-border rounded-lg border-gray-300 focus:border-[#F5B6C6] focus:ring-[#F5B6C6] text-sm appearance-none"
                    style={{
                      width: '100%',
                      maxWidth: '100%',
                      minWidth: 0,
                      boxSizing: 'border-box',
                      display: 'block'
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recibirás un recordatorio
                  </p>
                </div>
                
                {/* MOTIVO */}
                <div className="w-full">
                  <Label className="text-black font-semibold block mb-1 text-sm">
                    Motivo (Opcional)
                  </Label>
                  <Input
                    type="text"
                    value={formContacto.motivo}
                    onChange={(e) => setFormContacto({ ...formContacto, motivo: e.target.value })}
                    placeholder="Ej: Cumpleaños..."
                    className="w-full min-w-0 box-border rounded-lg border-gray-300 focus:border-[#F5B6C6] focus:ring-[#F5B6C6] text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ¿Por qué es especial?
                  </p>
                </div>
                
                {/* BOTONES */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    type="submit" 
                    className={`flex-1 text-white rounded-full transition-all duration-300 ${
                      direccionSeleccionada && formContacto.direccion && formContacto.nombre && formContacto.telefono
                        ? 'bg-[#F5B6C6] hover:bg-[#F5B6C6]/90 shadow-lg shadow-[#F5B6C6]/50' 
                        : 'bg-[#F5B6C6] hover:bg-[#F5B6C6]/90'
                    }`}
                  >
                    Guardar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setModalContacto(false)
                      setDireccionSeleccionada(false)
                    }}
                    className="flex-1 rounded-full"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>,
        document.body
      )}

      {/* Modal Editar Pedido */}
      {modalEditarPedido && pedidoEditando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="bg-[#F5B6C6]/10">
              <CardTitle className="text-black font-bold">
                Editar Pedido #{pedidoEditando.id.slice(0, 8).toUpperCase()}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Modifica los datos del destinatario y horario de entrega
              </p>
              {!puedeReprogramar && (
                <p className="text-xs text-orange-600 mt-2 font-semibold flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  Solo puedes reprogramar fecha y hora con 4 horas de anticipación
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleGuardarPedido} className="space-y-4">
                <div>
                  <Label className="text-black font-semibold">Nombre del Destinatario *</Label>
                  <Input
                    type="text"
                    value={formPedido.nombre_destinatario}
                    onChange={(e) => setFormPedido({ ...formPedido, nombre_destinatario: e.target.value })}
                    required
                    className="rounded-lg"
                    placeholder="¿A quién va dirigido el pedido?"
                  />
                </div>
                
                <div>
                  <Label className="text-black font-semibold mb-2 block">
                    ¿Deseas cambiar el número del destinatario?
                  </Label>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => setCambiarTelefono(true)}
                      className={`flex-1 rounded-full transition-all ${
                        cambiarTelefono
                          ? 'bg-[#F5B6C6] text-white hover:bg-[#F5B6C6]/90'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Sí
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCambiarTelefono(false)}
                      className={`flex-1 rounded-full transition-all ${
                        !cambiarTelefono
                          ? 'bg-[#F5B6C6] text-white hover:bg-[#F5B6C6]/90'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      No
                    </Button>
                  </div>
                  
                  {/* Mostrar input de teléfono solo si seleccionó "Sí" */}
                  {cambiarTelefono && (
                    <div className="mt-3">
                      <Label className="text-black font-semibold">Nuevo Teléfono del Destinatario *</Label>
                      <Input
                        type="tel"
                        value={formPedido.tel_destinatario}
                        onChange={(e) => setFormPedido({ ...formPedido, tel_destinatario: e.target.value })}
                        required={cambiarTelefono}
                        className="rounded-lg"
                        placeholder="Ej: 55 1234 5678"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Para coordinar la entrega
                      </p>
                    </div>
                  )}
                  
                  {/* Mostrar teléfono actual si no cambia */}
                  {!cambiarTelefono && pedidoEditando && (
                    <p className="text-sm text-gray-600 mt-2">
                      Se mantendrá el teléfono actual: <span className="font-semibold">{pedidoEditando.tel_destinatario}</span>
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-black font-semibold">
                    Horario de Entrega *
                  </Label>
                  <select
                    value={formPedido.horario_entrega}
                    onChange={(e) => setFormPedido({ ...formPedido, horario_entrega: e.target.value })}
                    required
                    disabled={!puedeReprogramar}
                    className={`w-full rounded-lg border border-gray-300 p-2 ${
                      !puedeReprogramar ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">Selecciona un horario</option>
                    <option value="10:00-13:00">Mañana (10:00 - 13:00)</option>
                    <option value="13:00-15:00">Mediodía (13:00 - 15:00)</option>
                    <option value="15:00-18:00">Tarde (15:00 - 18:00)</option>
                  </select>
                  {!puedeReprogramar && (
                    <p className="text-xs text-gray-500 mt-1">
                      El horario está bloqueado porque faltan menos de 4 horas para la entrega
                    </p>
                  )}
                </div>
                
                <div>
                  <Label className="text-black font-semibold">Dedicatoria (Opcional)</Label>
                  <Textarea
                    value={formPedido.dedicatoria}
                    onChange={(e) => setFormPedido({ ...formPedido, dedicatoria: e.target.value })}
                    className="rounded-lg min-h-[100px]"
                    placeholder="Escribe tu mensaje especial aquí..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Incluiremos tu mensaje en una tarjeta personalizada
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-[#F5B6C6] hover:bg-[#F5B6C6]/90 text-white rounded-full font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Guardar Cambios
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setModalEditarPedido(false)
                      setPedidoEditando(null)
                    }}
                    className="flex-1 rounded-full border-2"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mis Pedidos con Tabs */}
      <Card className="shadow-lg rounded-2xl border-[#F5B6C6]/30">
        <CardHeader className="bg-gradient-to-r from-[#F5B6C6]/10 to-white border-b border-[#F5B6C6]/20">
          <CardTitle className="text-2xl font-bold text-[#F5B6C6] flex items-center gap-2">
            <Package className="h-6 w-6" />
            Mis Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="activos" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 p-1 rounded-xl">
              <TabsTrigger value="activos" className="rounded-lg data-[state=active]:bg-[#F5B6C6] data-[state=active]:text-white">
                Activos ({pedidosActivos.length})
              </TabsTrigger>
              <TabsTrigger value="completados" className="rounded-lg data-[state=active]:bg-[#F5B6C6] data-[state=active]:text-white">
                Completados ({pedidosCompletados.length})
              </TabsTrigger>
              <TabsTrigger value="cancelados" className="rounded-lg data-[state=active]:bg-[#F5B6C6] data-[state=active]:text-white">
                Cancelados ({pedidosCancelados.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activos" className="space-y-4">
              {pedidosActivos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No tienes pedidos activos</p>
                </div>
              ) : (
                pedidosActivos.map(renderPedidoCard)
              )}
            </TabsContent>

            <TabsContent value="completados" className="space-y-4">
              {pedidosCompletados.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No tienes pedidos completados aún</p>
                </div>
              ) : (
                pedidosCompletados.map(renderPedidoCard)
              )}
            </TabsContent>

            <TabsContent value="cancelados" className="space-y-4">
              {pedidosCancelados.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No tienes pedidos cancelados</p>
                </div>
              ) : (
                pedidosCancelados.map(renderPedidoCard)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Botones finales: Centro de Ayuda y Cerrar Sesión */}
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        {/* Botón Centro de Ayuda */}
        <Button
          onClick={() => router.push('/tienda/ayuda')}
          className="bg-[#F5B6C6] hover:bg-[#F5B6C6]/90 text-white rounded-full px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <HelpCircle className="w-5 h-5 mr-2" />
          Centro de Ayuda
        </Button>

        {/* Botón Cerrar Sesión */}
        <Button
          variant="outline"
          onClick={() => {
            if (confirm('¿Cerrar sesión?')) {
              logout()
              router.push('/tienda/login')
            }
          }}
          className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-[#F5B6C6] hover:text-[#F5B6C6] rounded-full px-8 py-6"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}

export default function CuentaPage() {
  return (
    <TiendaLayoutWrapper>
      <CuentaContent />
    </TiendaLayoutWrapper>
  )
}
