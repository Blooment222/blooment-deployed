'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TiendaLayoutWrapper } from '@/components/TiendaLayoutWrapper'
import { useCarrito } from '@/lib/carrito-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Loader2, Package, XCircle } from 'lucide-react'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clearCart } = useCarrito()
  const [loading, setLoading] = useState(true)
  const [cartCleared, setCartCleared] = useState(false)
  const [pedidoCreado, setPedidoCreado] = useState(false)
  const [error, setError] = useState(null)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    const verificarYCrearPedido = async () => {
      if (!sessionId || pedidoCreado) {
        setLoading(false)
        return
      }

      try {
        // Obtener el token del cliente
        const token = localStorage.getItem('cliente_token')
        
        if (!token) {
          setError('No se encontró la sesión del cliente')
          setLoading(false)
          return
        }

        // Llamar al endpoint para verificar y crear el pedido
        const res = await fetch('/api/checkout/verify-and-create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ sessionId })
        })

        if (res.ok) {
          const data = await res.json()
          setPedidoCreado(true)
          
          // Limpiar el carrito solo después de crear el pedido exitosamente
          if (!cartCleared) {
            clearCart()
            setCartCleared(true)
          }
        } else {
          const errorData = await res.json()
          console.error('Error al crear pedido:', errorData)
          setError(errorData.error || 'Error al procesar el pedido')
        }
      } catch (err) {
        console.error('Error:', err)
        setError('Error al procesar el pedido')
      } finally {
        setLoading(false)
      }
    }

    verificarYCrearPedido()
  }, [sessionId]) // ⚠️ CRÍTICO: Solo sessionId como dependencia para evitar loop infinito

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="h-12 w-12 animate-spin text-[#F5B6C6] mb-4" />
        <p className="text-muted-foreground">Verificando tu pago y creando tu pedido...</p>
        <p className="text-sm text-muted-foreground mt-2">Esto puede tomar unos segundos</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-red-200">
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <p className="text-red-600 font-semibold mb-2">Hubo un problema</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <p className="text-sm text-muted-foreground mb-4">
              Tu pago fue exitoso pero hubo un problema al registrar tu pedido. 
              Por favor, contacta a soporte con tu número de sesión.
            </p>
            <p className="text-xs text-muted-foreground mb-4 font-mono bg-gray-100 p-2 rounded">
              {sessionId}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => router.push('/tienda/cuenta')}>
                Ver Mis Pedidos
              </Button>
              <Button onClick={() => router.push('/tienda')}>
                Volver a la Tienda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!sessionId) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No se encontró información de pago
            </p>
            <Button onClick={() => router.push('/tienda')}>
              Ir a la Tienda
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-green-200">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-20 w-20 text-green-500" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-600">
            ¡Pago Exitoso!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-lg text-muted-foreground">
            Tu pedido ha sido procesado correctamente
          </p>

          <div className="bg-stone-50 p-4 rounded-2xl">
            <p className="text-sm text-muted-foreground mb-1">
              ID de Transacción
            </p>
            <p className="font-mono text-sm break-all">
              {sessionId}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Recibirás un email de confirmación con los detalles de tu pedido.
            </p>
            <p className="text-sm text-muted-foreground">
              Puedes revisar el estado de tu pedido en la sección "Mi Cuenta".
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              className="flex-1 bg-[#F5B6C6] hover:bg-[#F5B6C6]"
              onClick={() => {
                router.push('/tienda/cuenta')
              }}
              type="button"
            >
              <Package className="mr-2 h-4 w-4" />
              Ver Mis Pedidos
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                router.push('/tienda')
              }}
              type="button"
            >
              Continuar Comprando
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <TiendaLayoutWrapper>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-[#F5B6C6]" /></div>}>
        <SuccessContent />
      </Suspense>
    </TiendaLayoutWrapper>
  )
}
