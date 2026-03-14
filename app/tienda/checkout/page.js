'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TiendaLayoutWrapper } from '@/components/TiendaLayoutWrapper'
import { useCarrito } from '@/lib/carrito-context'
import { useClienteAuth } from '@/lib/cliente-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/label'
import { Label } from '@/components/ui/label'
import { Loader2, Package } from 'lucide-react'
import Image from 'next/image'

function CheckoutContent() {
  const router = useRouter()
  const { items, getTotal, clearCart } = useCarrito()
  const { user, getToken, loading: authLoading } = useClienteAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [detallesEntrega, setDetallesEntrega] = useState(null)

  useEffect(() => {
    // Cargar detalles de entrega del localStorage
    const detallesEntregaStr = localStorage.getItem('detalles_entrega')
    if (detallesEntregaStr) {
      const datos = JSON.parse(detallesEntregaStr)
      console.log('📦 Detalles de entrega cargados:', datos)
      setDetallesEntrega(datos)
    } else {
      console.warn('⚠️ No se encontraron detalles de entrega en localStorage')
    }
  }, [])

  useEffect(() => {
    // Esperar a que la autenticación se complete
    if (!authLoading) {
      if (!user) {
        router.push('/tienda/login?redirect=checkout')
      } else {
        setIsReady(true)
      }
    }
  }, [user, authLoading, router])

  const handleCheckout = async () => {
    setLoading(true)
    setError('')

    // Validar que el usuario tenga dirección
    if (!user.direccion) {
      setError('Por favor agrega una dirección de envío en tu perfil antes de continuar')
      setLoading(false)
      return
    }

    try {
      const token = getToken()
      const origin = window.location.origin
      
      // Obtener detalles de entrega del localStorage
      const detallesEntregaStr = localStorage.getItem('detalles_entrega')
      const detallesEntrega = detallesEntregaStr ? JSON.parse(detallesEntregaStr) : null
      
      if (!detallesEntrega) {
        setError('Faltan los detalles de entrega. Por favor vuelve atrás y completa el formulario.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            cantidad: item.cantidad
          })),
          origin,
          detallesEntrega
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar el pago')
      }

      // Redirigir a Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No se recibió URL de checkout')
      }

    } catch (err) {
      console.error('❌ Error en checkout:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  if (authLoading || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Tu carrito está vacío</p>
            <Button onClick={() => router.push('/tienda')}>
              Ir a la Tienda
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Finalizar Compra</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Información de envío del DESTINATARIO */}
        <div>
          <Card className="border-[#F5B6C6] border-2">
            <CardHeader>
              <CardTitle className="text-black">Información de Envío</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {detallesEntrega ? (
                <>
                  <div>
                    <Label className="text-sm font-bold text-black">Nombre del Destinatario:</Label>
                    <p className="text-[#F5B6C6] font-semibold mt-1">
                      {detallesEntrega.nombre_destinatario || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-bold text-black">Teléfono de Contacto:</Label>
                    <p className="text-[#F5B6C6] font-semibold mt-1">
                      {detallesEntrega.telefono_destinatario || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-bold text-black">Dirección de Entrega:</Label>
                    <p className="text-[#F5B6C6] font-semibold mt-1">
                      {detallesEntrega.direccion || 'No especificada'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-bold text-black">Horario de Entrega:</Label>
                    <p className="text-[#F5B6C6] font-semibold mt-1">
                      {detallesEntrega.horario_entrega || 'No especificado'}
                    </p>
                  </div>
                  {detallesEntrega.dedicatoria && (
                    <div>
                      <Label className="text-sm font-bold text-black">Dedicatoria (Mensaje para la tarjeta):</Label>
                      <p className="text-[#F5B6C6] font-semibold italic mt-1">
                        "{detallesEntrega.dedicatoria}"
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-500">
                  Cargando información de envío...
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumen del pedido */}
        <div>
          <Card className="border-[#F5B6C6] border-2">
            <CardHeader>
              <CardTitle className="text-black">Resumen del Pedido</CardTitle>
              <CardDescription className="text-black">
                {items.length} {items.length === 1 ? 'producto' : 'productos'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((item) => {
                  const precio = item.en_oferta && item.precio_oferta 
                    ? item.precio_oferta 
                    : item.precio
                  
                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-16 h-16 flex-shrink-0 bg-stone-100 rounded overflow-hidden">
                        {item.imagen_url ? (
                          <Image
                            src={item.imagen_url}
                            alt={item.nombre}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                            Sin imagen
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-black">{item.nombre}</h4>
                        <p className="text-sm text-black">
                          Cantidad: {item.cantidad}
                        </p>
                        <p className="text-sm font-semibold text-[#F5B6C6]">
                          MXN ${(precio * item.cantidad).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="border-t border-[#F5B6C6] pt-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold text-black">Total:</span>
                  <span className="text-[#F5B6C6] text-2xl font-bold">MXN ${getTotal().toFixed(2)}</span>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}

              <Button
                className="w-full bg-[#F5B6C6] hover:bg-[#F5B6C6]/90 h-12"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Proceder al Pago'
                )}
              </Button>

              <p className="text-xs text-black text-center">
                Serás redirigido a Stripe para completar el pago de forma segura
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <TiendaLayoutWrapper>
      <CheckoutContent />
    </TiendaLayoutWrapper>
  )
}
