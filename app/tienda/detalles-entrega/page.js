'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useClienteAuth } from '@/lib/cliente-auth'
import { useCarrito } from '@/lib/carrito-context'
import { TiendaLayoutWrapper } from '@/components/TiendaLayoutWrapper'
import { MapboxAutocomplete } from '@/components/MapboxAutocomplete'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MapPin, User, Phone, Clock, Heart, ArrowRight, Package, BookUser, UserPlus, Star } from 'lucide-react'

const HORARIOS = [
  { id: '9-12', label: '9:00 AM - 12:00 PM', value: '09:00-12:00' },
  { id: '12-15', label: '12:00 PM - 3:00 PM', value: '12:00-15:00' },
  { id: '15-18', label: '3:00 PM - 6:00 PM', value: '15:00-18:00' },
  { id: '18-21', label: '6:00 PM - 9:00 PM', value: '18:00-21:00' }
]

function DetallesEntregaContent() {
  const router = useRouter()
  const { user, loading: authLoading } = useClienteAuth()
  const { items = [] } = useCarrito()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authChecked, setAuthChecked] = useState(false)
  
  // Estados para el sistema de selección de destinatario
  const [tipoDestinatario, setTipoDestinatario] = useState(null) // 'guardado' | 'nuevo'
  const [contactosFavoritos, setContactosFavoritos] = useState([])
  const [mostrarContactos, setMostrarContactos] = useState(false)
  const [cargandoContactos, setCargandoContactos] = useState(false)

  const [formData, setFormData] = useState({
    direccion: '',
    coordenadas: null, // { lat, lng }
    nombre_destinatario: '',
    telefono_destinatario: '',
    horario_entrega: '',
    dedicatoria: ''
  })

  // Función para cargar contactos favoritos - CON DIAGNÓSTICO COMPLETO
  const cargarContactosFavoritos = async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 DIAGNÓSTICO: Cargando contactos favoritos')
    console.log('User object:', user)
    console.log('User ID:', user?.id || 'NO DISPONIBLE')
    console.log('User email:', user?.email || 'NO DISPONIBLE')
    
    if (!user) {
      console.log('❌ PROBLEMA: No hay usuario autenticado')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      return
    }
    
    setCargandoContactos(true)
    try {
      const token = localStorage.getItem('cliente_token')
      console.log('🔑 Token presente:', !!token)
      
      if (!token) {
        console.log('❌ PROBLEMA: No hay token en localStorage')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        setCargandoContactos(false)
        return
      }

      console.log('📡 Haciendo fetch a /api/contactos-favoritos...')
      const response = await fetch('/api/contactos-favoritos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('📨 Respuesta recibida - Status:', response.status, response.ok ? '✅' : '❌')
      
      if (response.ok) {
        const data = await response.json()
        console.log('📦 DATA COMPLETA recibida:', data)
        console.log('📦 Tipo de data:', typeof data)
        console.log('📦 Es array?:', Array.isArray(data))
        console.log('📦 data.contactos existe?:', !!data.contactos)
        console.log('📦 data.contactos es array?:', Array.isArray(data.contactos))
        
        const contactos = data.contactos || data || []
        console.log('✅ Contactos procesados:', contactos)
        console.log('✅ Cantidad de contactos:', contactos.length)
        
        if (contactos.length > 0) {
          console.log('📋 Primer contacto:', contactos[0])
        } else {
          console.log('⚠️ Array de contactos VACÍO - El usuario no tiene contactos guardados')
        }
        
        setContactosFavoritos(contactos)
      } else {
        console.log('❌ PROBLEMA: Error en respuesta del servidor')
        console.log('Status code:', response.status)
        const errorText = await response.text()
        console.log('Error message:', errorText)
        setContactosFavoritos([])
      }
    } catch (err) {
      console.error('❌ EXCEPCIÓN capturada:', err)
      console.error('Error completo:', err.message, err.stack)
      setContactosFavoritos([])
    } finally {
      setCargandoContactos(false)
      console.log('✅ Proceso de carga finalizado')
      console.log('Estado final - cargandoContactos:', false)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    }
  }

  // REMOVIDO: useEffect automático que causaba infinite loop
  // Los contactos SOLO se cargan cuando el usuario hace clic en "Contacto Guardado"
  
  // Handler para seleccionar "Contacto Guardado"
  const handleContactoGuardado = () => {
    console.log('🔘 Botón Contacto Guardado presionado')
    setTipoDestinatario('guardado')
    setMostrarContactos(true)
    // Cargar contactos SOLO cuando se hace clic aquí
    cargarContactosFavoritos()
  }
  
  // Handler para seleccionar "Alguien Nuevo"
  const handleAlguienNuevo = () => {
    console.log('🔘 Botón Alguien Nuevo presionado')
    setTipoDestinatario('nuevo')
    setMostrarContactos(false)
  }

  // Función para seleccionar un contacto guardado
  const seleccionarContacto = (contacto) => {
    console.log('✅ Contacto seleccionado:', contacto.nombre)
    console.log('📍 Dirección del contacto:', contacto.direccion)
    setFormData({
      ...formData,
      nombre_destinatario: contacto.nombre,
      telefono_destinatario: contacto.telefono,
      direccion: contacto.direccion || '',
      coordenadas: contacto.coordenadas || null
    })
    setMostrarContactos(false)
  }
  
  // Verificar si el contacto guardado tiene dirección
  const contactoTieneDireccion = tipoDestinatario === 'guardado' && 
    !mostrarContactos && 
    formData.nombre_destinatario && 
    formData.direccion

  // Manejo de autenticación - SIN cierre automático de sesión
  useEffect(() => {
    // PASO 1: Verificar localStorage ANTES que el contexto
    const token = localStorage.getItem('cliente_token')
    
    if (token) {
      // Hay token guardado: esperar a que el contexto lo cargue
      console.log('✅ Token encontrado, esperando validación del contexto...')
      
      if (!authLoading && user) {
        // Usuario cargado correctamente
        console.log('✅ Usuario autenticado:', user.email)
        return
      }
      
      // Si está cargando, esperar
      if (authLoading) {
        console.log('⏳ Cargando autenticación...')
        return
      }
      
      // Si terminó de cargar y no hay usuario, el token es inválido
      if (!authLoading && !user) {
        console.log('⚠️ Token inválido, redirigiendo a login')
        router.push('/tienda/login?redirect=/tienda/detalles-entrega')
      }
    } else {
      // No hay token: redirigir inmediatamente
      if (!authChecked) {
        console.log('❌ Sin token, redirigiendo a login')
        setAuthChecked(true)
        router.push('/tienda/login?redirect=/tienda/detalles-entrega')
      }
    }
  }, [user, authLoading, router, authChecked])

  useEffect(() => {
    if (items.length === 0 && user) {
      router.push('/tienda/carrito')
    }
  }, [items, router, user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.direccion || !formData.nombre_destinatario || !formData.telefono_destinatario || !formData.horario_entrega) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }

    // Guardar datos en localStorage para checkout
    localStorage.setItem('detalles_entrega', JSON.stringify(formData))
    
    // Ir a checkout
    router.push('/tienda/checkout')
  }

  const seleccionarHorario = (horario) => {
    setFormData({ ...formData, horario_entrega: horario.value })
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-400">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F5B6C6] mb-1">Detalles de Entrega</h1>
        <p className="text-sm text-gray-600">Completa la información para tu pedido</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tarjeta de Datos del Destinatario - PRIMERO: Seleccionar quién recibe */}
        <Card className="p-5 border-[#F5B6C6] border-opacity-20">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-[#F5B6C6]" />
            <h3 className="font-bold text-[#F5B6C6]">¿Quién Recibe?</h3>
          </div>

          {/* PASO 1: Botones de Selección */}
          {!tipoDestinatario && (
            <div className="grid grid-cols-2 gap-4">
              {/* Botón: Contacto Guardado */}
              <button
                type="button"
                onClick={handleContactoGuardado}
                className="group relative flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-[#F5B6C6] hover:bg-pink-50/30 transition-all duration-100 cursor-pointer"
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-pink-100 group-hover:bg-[#F5B6C6] transition-all duration-100 mb-3">
                  <BookUser className="w-7 h-7 text-[#F5B6C6] group-hover:text-white transition-colors duration-100" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Contacto Guardado</h4>
                <p className="text-xs text-gray-500 text-center">
                  Selecciona de tus favoritos
                </p>
              </button>

              {/* Botón: Alguien Nuevo */}
              <button
                type="button"
                onClick={handleAlguienNuevo}
                className="group relative flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-[#F5B6C6] hover:bg-pink-50/30 transition-all duration-100 cursor-pointer"
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-pink-100 group-hover:bg-[#F5B6C6] transition-all duration-100 mb-3">
                  <UserPlus className="w-7 h-7 text-[#F5B6C6] group-hover:text-white transition-colors duration-100" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Alguien Nuevo</h4>
                <p className="text-xs text-gray-500 text-center">
                  Ingresa los datos manualmente
                </p>
              </button>
            </div>
          )}

          {/* PASO 2A: Lista de Contactos Guardados */}
          {tipoDestinatario === 'guardado' && mostrarContactos && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">
                  Selecciona un contacto:
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTipoDestinatario(null)
                    setMostrarContactos(false)
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Cambiar
                </Button>
              </div>

              {cargandoContactos ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5B6C6]"></div>
                  <p className="text-sm text-gray-500 mt-2">Cargando contactos...</p>
                </div>
              ) : contactosFavoritos.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <BookUser className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Aún no tienes contactos guardados
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    ¡Agrega uno nuevo abajo!
                  </p>
                  <button
                    type="button"
                    onClick={handleAlguienNuevo}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5B6C6] text-white rounded-lg text-sm hover:bg-[#F5B6C6]/90 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Ingresar datos manualmente
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {contactosFavoritos.map((contacto) => (
                    <button
                      key={contacto.id}
                      type="button"
                      onClick={() => seleccionarContacto(contacto)}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#F5B6C6] hover:bg-pink-50/30 transition-all duration-100 text-left group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {contacto.motivo && (
                              <Heart className="w-4 h-4 text-[#F5B6C6]" />
                            )}
                            <h5 className="font-semibold text-gray-900 group-hover:text-[#F5B6C6] transition-colors">
                              {contacto.nombre}
                            </h5>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-3 h-3" />
                            <span>{contacto.telefono}</span>
                          </div>
                          {contacto.direccion && (
                            <div className="flex items-start gap-2 text-xs text-gray-500 mt-1">
                              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">{contacto.direccion}</span>
                            </div>
                          )}
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#F5B6C6] transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PASO 2B: Campos Manuales para Alguien Nuevo */}
          {tipoDestinatario === 'nuevo' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">
                  Ingresa los datos del destinatario:
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTipoDestinatario(null)
                    setFormData({
                      ...formData,
                      nombre_destinatario: '',
                      telefono_destinatario: ''
                    })
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Cambiar
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Nombre completo *
                </label>
                <Input
                  type="text"
                  value={formData.nombre_destinatario}
                  onChange={(e) => setFormData({ ...formData, nombre_destinatario: e.target.value })}
                  placeholder="Ej: María González"
                  className="border-gray-200 focus:border-[#F5B6C6] focus:ring-[#F5B6C6]"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#F5B6C6]" />
                  Teléfono de contacto *
                </label>
                <Input
                  type="tel"
                  value={formData.telefono_destinatario}
                  onChange={(e) => setFormData({ ...formData, telefono_destinatario: e.target.value })}
                  placeholder="Ej: 55 1234 5678"
                  className="border-gray-200 focus:border-[#F5B6C6] focus:ring-[#F5B6C6]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1 ml-1">
                  Para coordinar la entrega
                </p>
              </div>
            </div>
          )}

          {/* Mostrar datos seleccionados de contacto guardado */}
          {tipoDestinatario === 'guardado' && !mostrarContactos && formData.nombre_destinatario && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">
                  Contacto seleccionado:
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarContactos(true)}
                  className="text-[#F5B6C6] hover:text-[#F5B6C6]/80"
                >
                  Cambiar
                </Button>
              </div>

              <div className="p-4 bg-pink-50/50 border-2 border-[#F5B6C6] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-[#F5B6C6]" />
                  <span className="font-semibold text-gray-900">{formData.nombre_destinatario}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-[#F5B6C6]" />
                  <span>{formData.telefono_destinatario}</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Tarjeta de Dirección - SOLO aparece cuando se selecciona "Alguien Nuevo" */}
        {tipoDestinatario === 'nuevo' && (
          <Card className="p-6 border-2 border-[#F5B6C6] border-opacity-30 bg-gradient-to-br from-pink-50 to-white animate-in fade-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#F5B6C6] flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#F5B6C6]">Dirección de Entrega</h2>
                <p className="text-xs text-gray-600">¿A dónde enviamos las flores?</p>
              </div>
            </div>
            
            <MapboxAutocomplete
              value={formData.direccion}
              onChange={(value) => setFormData({ ...formData, direccion: value })}
              onAddressSelect={(addressData) => {
                setFormData({
                  ...formData,
                  direccion: addressData.fullAddress,
                  coordenadas: {
                    lat: addressData.latitude,
                    lng: addressData.longitude
                  }
                })
              }}
              placeholder="Ej: Av. Insurgentes Sur 1234, Col. Del Valle, CDMX"
              className="h-12 text-base"
            />
          </Card>
        )}

        {/* Mostrar dirección del contacto guardado (solo lectura) */}
        {tipoDestinatario === 'guardado' && !mostrarContactos && formData.nombre_destinatario && formData.direccion && (
          <Card className="p-5 border-2 border-green-200 bg-gradient-to-br from-green-50 to-white animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700">
                  Se entregará en la dirección guardada de <strong>{formData.nombre_destinatario}</strong>
                </p>
                <p className="text-xs text-green-600 mt-1">{formData.direccion}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Tarjeta de Horario - BOTONES PILLS */}
        <Card className="p-5 border-[#F5B6C6] border-opacity-20">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-[#F5B6C6]" />
            <h3 className="font-bold text-[#F5B6C6]">Horario de Entrega *</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {HORARIOS.map((horario) => (
              <button
                key={horario.id}
                type="button"
                onClick={() => seleccionarHorario(horario)}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                  formData.horario_entrega === horario.value
                    ? 'border-[#F5B6C6] bg-[#F5B6C6] text-white shadow-md'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-[#F5B6C6] hover:bg-pink-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Clock className={`w-4 h-4 ${
                    formData.horario_entrega === horario.value ? 'text-white' : 'text-[#F5B6C6]'
                  }`} />
                  <span className="text-sm font-medium">{horario.label}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Tarjeta de Dedicatoria */}
        <Card className="p-5 border-[#F5B6C6] border-opacity-20 bg-gradient-to-br from-white to-pink-50">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-[#F5B6C6]" />
            <h3 className="font-bold text-[#F5B6C6]">Dedicatoria</h3>
            <span className="text-xs text-gray-500">(opcional)</span>
          </div>

          <Textarea
            value={formData.dedicatoria}
            onChange={(e) => setFormData({ ...formData, dedicatoria: e.target.value })}
            placeholder="Escribe un mensaje especial para acompañar las flores..."
            className="border-gray-200 focus:border-[#F5B6C6] focus:ring-[#F5B6C6] min-h-[100px] resize-none"
            maxLength={200}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              💌 Tu mensaje será escrito en una tarjeta especial
            </p>
            <span className="text-xs text-gray-400">
              {formData.dedicatoria.length}/200
            </span>
          </div>
        </Card>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Resumen y Botón de Continuar */}
        <Card className="p-6 border-[#F5B6C6] border-opacity-30 sticky bottom-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#F5B6C6]" />
              <span className="font-medium text-gray-700">
                {items.length} {items.length === 1 ? 'producto' : 'productos'} en tu pedido
              </span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F5B6C6] hover:bg-[#F5B6C6] rounded-full h-14 text-base font-bold flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? 'Procesando...' : 'Continuar al Pago'}
            <ArrowRight className="w-5 h-5" />
          </Button>

          <p className="text-xs text-center text-gray-500 mt-3">
            En el siguiente paso podrás revisar tu pedido y realizar el pago
          </p>
        </Card>
      </form>
    </div>
  )
}

export default function DetallesEntregaPage() {
  return (
    <TiendaLayoutWrapper>
      <DetallesEntregaContent />
    </TiendaLayoutWrapper>
  )
}
