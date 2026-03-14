'use client'

import React, { useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCarrito } from '@/lib/carrito-context'
import { useClienteAuth } from '@/lib/cliente-auth'
import { TiendaLayoutWrapper } from '@/components/TiendaLayoutWrapper'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Flower, MapPin, Tag, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import confetti from 'canvas-confetti'

function CarritoContent() {
  const router = useRouter()
  const { items = [], removeItem, updateQuantity, getTotal } = useCarrito()
  const { user } = useClienteAuth()

  const [codigoCupon, setCodigoCupon] = useState('')
  const [cuponAplicado, setCuponAplicado] = useState(null)
  const [loadingCupon, setLoadingCupon] = useState(false)
  const [errorCupon, setErrorCupon] = useState('')
  const [mostrarMensajeExito, setMostrarMensajeExito] = useState(false)

  const subtotal = useMemo(() => getTotal(), [items, getTotal])

  const descuentoCupon = useMemo(() => {
    if (!cuponAplicado) return 0
    return cuponAplicado.descuento || 0
  }, [cuponAplicado])

  const total = useMemo(() => {
    return Math.max(0, subtotal - descuentoCupon) // Envío GRATIS
  }, [subtotal, descuentoCupon])

  // Función para obtener el precio correcto (con o sin oferta)
  const getPrecioFinal = (item) => {
    return item.en_oferta && item.precio_oferta ? item.precio_oferta : item.precio
  }

  // Función de confeti con colores de marca
  const lanzarConfeti = () => {
    const duracion = 2500 // 2.5 segundos
    const finalizacion = Date.now() + duracion

    const colores = ['#F5B6C6', '#FFD1DC', '#FFFFFF', '#FFC0CB'] // Rosa oficial + tonos claros

    const intervalo = setInterval(() => {
      const tiempoRestante = finalizacion - Date.now()

      if (tiempoRestante <= 0) {
        return clearInterval(intervalo)
      }

      const particleCount = 3
      
      // Confeti desde arriba hacia el centro
      confetti({
        particleCount,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0 },
        colors: colores,
        gravity: 1,
        scalar: 1.2,
        drift: 0
      })
      
      confetti({
        particleCount,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0 },
        colors: colores,
        gravity: 1,
        scalar: 1.2,
        drift: 0
      })
    }, 50)
  }

  const aplicarCupon = async () => {
    if (!codigoCupon) return

    setLoadingCupon(true)
    setErrorCupon('')

    try {
      const response = await fetch('/api/cupones/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          codigo: codigoCupon,
          monto_pedido: subtotal 
        })
      })

      const data = await response.json()

      if (response.ok) {
        setCuponAplicado(data)
        setErrorCupon('')
        
        // 🎉 LANZAR CONFETI con colores rosa
        lanzarConfeti()
        
        // Mostrar mensaje de éxito animado
        setMostrarMensajeExito(true)
        
        // Ocultar mensaje después de 3 segundos
        setTimeout(() => {
          setMostrarMensajeExito(false)
        }, 3000)
      } else {
        setErrorCupon(data.error || 'Cupón no válido')
        setCuponAplicado(null)
      }
    } catch (error) {
      console.error('Error validando cupón:', error)
      setErrorCupon('Error al validar el cupón')
      setCuponAplicado(null)
    } finally {
      setLoadingCupon(false)
    }
  }

  const removerCupon = () => {
    setCuponAplicado(null)
    setCodigoCupon('')
    setErrorCupon('')
    setMostrarMensajeExito(false)
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F5B6C6] mb-1">Mi Carrito</h1>
        <p className="text-sm text-gray-600">
          {items.length === 0 ? 'Tu carrito está vacío' : `${items.length} ${items.length === 1 ? 'producto' : 'productos'}`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="w-20 h-20 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-6">No hay productos en tu carrito</p>
          <Button
            onClick={() => router.push('/tienda')}
            className="bg-[#F5B6C6] hover:bg-[#F5B6C6] rounded-full px-8"
          >
            Explorar Productos
          </Button>
        </div>
      ) : (
        <>
          {/* Lista de productos */}
          <div className="space-y-4 mb-6">
            {items.map((item) => {
              const precioFinal = getPrecioFinal(item)
              const hayOferta = item.en_oferta && item.precio_oferta && item.precio_oferta < item.precio
              
              return (
              <Card key={item.id} className="overflow-hidden border-[#F5B6C6] border-opacity-20">
                <div className="flex gap-4 p-4">
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-pink-50">
                    {item.imagen_url ? (
                      <Image
                        src={item.imagen_url}
                        alt={item.nombre}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Flower className="w-8 h-8 text-pink-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#F5B6C6] mb-1 line-clamp-1">
                      {item.nombre}
                    </h3>
                    
                    {hayOferta ? (
                      <div className="mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#F5B6C6]">
                            {formatCurrency(precioFinal)} c/u
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            {formatCurrency(item.precio)}
                          </span>
                        </div>
                        <p className="text-xs text-green-600 font-medium">
                          ¡Descuento aplicado!
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mb-2">
                        {formatCurrency(precioFinal)} c/u
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.cantidad - 1))}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                      >
                        <Minus className="w-4 h-4 text-gray-600" />
                      </button>
                      <span className="w-8 text-center font-semibold">{item.cantidad}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                      >
                        <Plus className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-[#F5B6C6] text-lg">
                      {formatCurrency(precioFinal * item.cantidad)}
                    </p>
                    {hayOferta && (
                      <p className="text-xs text-gray-400 line-through">
                        {formatCurrency(item.precio * item.cantidad)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
              )
            })}
          </div>

          {/* Banner de Envío Gratis - Sin Captura de Dirección */}
          <Card className="p-6 mb-4 border-[#F5B6C6] border-2 shadow-lg bg-gradient-to-br from-pink-50 via-white to-pink-50">
            <div className="text-center space-y-3">
              {/* Icono y Título */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-[#F5B6C6] flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-9 h-9 text-white" />
                </div>
              </div>
              
              {/* Mensaje Principal */}
              <div>
                <h3 className="text-2xl font-bold text-[#F5B6C6] mb-1">
                  ✨ ¡Envío 100% GRATIS activado!
                </h3>
                <p className="text-sm text-gray-500">
                  La dirección de entrega se añadirá en el siguiente paso
                </p>
              </div>

              {/* Decoración */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="h-0.5 w-12 bg-[#F5B6C6] rounded-full"></div>
                <Flower className="w-4 h-4 text-[#F5B6C6]" />
                <div className="h-0.5 w-12 bg-[#F5B6C6] rounded-full"></div>
              </div>
            </div>
          </Card>

          {/* Campo de Cupón */}
          <Card className="p-5 mb-6 border-[#F5B6C6] border-opacity-20">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-5 h-5 text-[#F5B6C6]" />
              <h3 className="font-bold text-[#F5B6C6]">¿Tienes un cupón de descuento?</h3>
            </div>
            
            {/* Mensaje de Éxito Animado */}
            {mostrarMensajeExito && (
              <div className="mb-3 bg-[#F5B6C6] bg-opacity-10 border-2 border-[#F5B6C6] rounded-lg p-3 animate-pulse">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#F5B6C6]" />
                  <p className="font-bold text-[#F5B6C6]">
                    ¡Súper! Descuento aplicado 🌸
                  </p>
                </div>
              </div>
            )}
            
            {!cuponAplicado ? (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ingresa tu código"
                    value={codigoCupon}
                    onChange={(e) => setCodigoCupon(e.target.value.toUpperCase())}
                    className="border-gray-200 focus:border-[#F5B6C6] focus:ring-[#F5B6C6]"
                    disabled={loadingCupon}
                  />
                  <Button
                    onClick={aplicarCupon}
                    disabled={!codigoCupon || loadingCupon}
                    className="bg-[#F5B6C6] hover:bg-[#F5B6C6] text-white rounded-full px-6"
                  >
                    {loadingCupon ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Aplicar'
                    )}
                  </Button>
                </div>
                {errorCupon && (
                  <div className="flex items-center gap-2 text-sm text-red-500 mt-2">
                    <XCircle className="w-4 h-4" />
                    <span>{errorCupon}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-bold text-green-700">
                        {cuponAplicado.codigo}
                      </p>
                      <p className="text-xs text-gray-600">
                        {cuponAplicado.tipo === 'porcentaje' 
                          ? `${cuponAplicado.valor}% de descuento` 
                          : `${formatCurrency(cuponAplicado.valor)} de descuento`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removerCupon}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* Resumen del Pedido */}
          <Card className="p-6 pb-8 mb-6 border-[#F5B6C6] border-opacity-30 overflow-visible">
            <h2 className="font-bold text-lg mb-4 text-[#F5B6C6]">Resumen del Pedido</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              
              {/* Envío - GRATIS */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Envío</span>
                <span className="font-bold text-[#F5B6C6] text-base">
                  ¡GRATIS!
                </span>
              </div>

              {/* Cupón */}
              {cuponAplicado && descuentoCupon > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Descuento Cupón</span>
                  <span className="font-bold text-[#F5B6C6] text-base">
                    -{formatCurrency(descuentoCupon)}
                  </span>
                </div>
              )}
              
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-2xl text-[#F5B6C6]">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón de Proceder al Pago - Navegación Inteligente */}
            <div className="relative z-50 w-full mt-4">
              <button
                type="button"
                onClick={() => {
                  // Verificar si hay token de sesión
                  const token = localStorage.getItem('cliente_token')
                  
                  if (token && user) {
                    // Usuario logueado: ir directo a detalles-entrega
                    console.log('✅ Usuario autenticado, yendo a detalles-entrega')
                    router.push('/tienda/detalles-entrega')
                  } else {
                    // No hay sesión: ir a login con redirect
                    console.log('⚠️ Sin sesión, yendo a login')
                    router.push('/tienda/login?redirect=/tienda/detalles-entrega')
                  }
                }}
                className="block w-full bg-[#F5B6C6] hover:bg-[#F5B6C6]/90 rounded-full h-16 text-base font-bold text-white"
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Proceder al Pago →
              </button>
            </div>
            <p className="text-xs text-center text-gray-500 mt-2">
              💡 {user ? 'Continúa con tu compra' : 'Inicia sesión para continuar'}
            </p>
          </Card>
        </>
      )}
    </div>
  )
}

export default function CarritoPage() {
  return (
    <TiendaLayoutWrapper>
      <CarritoContent />
    </TiendaLayoutWrapper>
  )
}
