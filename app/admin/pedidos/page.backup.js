'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ShoppingBag, User, Package, Clock, CheckCircle, Truck, X, Gift, Phone, MessageSquare } from 'lucide-react'
import { useAuth } from '@/lib/auth-client'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { formatCurrency } from '@/lib/currency'

export default function PedidosAdmin() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos') // todos, pendiente, en_preparacion, enviado, entregado
  const { getToken } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchPedidos()
  }, [])

  const fetchPedidos = async () => {
    try {
      const token = getToken()
      if (!token) {
        console.error('No hay token disponible')
        setLoading(false)
        return
      }

      const res = await fetch('/api/pedidos/admin/todos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.ok) {
        const data = await res.json()
        setPedidos(data)
      } else {
        console.error('Error al obtener pedidos:', res.status)
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los pedidos',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error al obtener pedidos:', error)
      toast({
        title: 'Error',
        description: 'Ocurrió un error al cargar los pedidos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const actualizarEstado = async (pedidoId, nuevoEstado) => {
    try {
      const token = getToken()
      const res = await fetch(`/api/pedidos/admin/${pedidoId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      })

      if (res.ok) {
        toast({
          title: 'Éxito',
          description: 'Estado actualizado correctamente'
        })
        fetchPedidos()
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo actualizar el estado',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'Ocurrió un error al actualizar el estado',
        variant: 'destructive'
      })
    }
  }

  const getEstadoBadge = (estado) => {
    const estados = {
      'pendiente': { color: 'bg-yellow-500', text: 'Pendiente', icon: Clock },
      'en_preparacion': { color: 'bg-blue-500', text: 'En Preparación', icon: Package },
      'enviado': { color: 'bg-purple-500', text: 'Enviado', icon: Truck },
      'entregado': { color: 'bg-green-500', text: 'Entregado', icon: CheckCircle },
      'cancelado': { color: 'bg-red-500', text: 'Cancelado', icon: X }
    }
    
    const estadoInfo = estados[estado] || estados['pendiente']
    const Icon = estadoInfo.icon

    return (
      <Badge className={`${estadoInfo.color} text-white flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {estadoInfo.text}
      </Badge>
    )
  }

  const pedidosFiltrados = pedidos.filter(pedido => {
    if (filter === 'todos') return true
    return pedido.estado === filter
  })

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-center text-muted-foreground">Cargando pedidos...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <Toaster />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Pedidos</h1>
          <p className="text-gray-600 mt-1">Administra y actualiza el estado de todos los pedidos</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="en_preparacion">En Preparación</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="entregado">Entregado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pedidos.filter(p => p.estado === 'pendiente').length}</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pedidos.filter(p => p.estado === 'en_preparacion').length}</p>
                <p className="text-sm text-muted-foreground">En Preparación</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Truck className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pedidos.filter(p => p.estado === 'enviado').length}</p>
                <p className="text-sm text-muted-foreground">Enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pedidos.filter(p => p.estado === 'entregado').length}</p>
                <p className="text-sm text-muted-foreground">Entregados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de pedidos */}
      <div className="space-y-4">
        {pedidosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay pedidos para mostrar</p>
            </CardContent>
          </Card>
        ) : (
          pedidosFiltrados.map((pedido) => (
            <Card key={pedido.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        Pedido #{pedido.id.slice(0, 8)}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4" />
                        {pedido.cliente ? pedido.cliente.nombre : pedido.nombre_cliente} - {pedido.cliente ? pedido.cliente.email : pedido.email_cliente}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getEstadoBadge(pedido.estado)}
                    <p className="text-sm text-muted-foreground">
                      {new Date(pedido.createdAt).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                {/* Productos del pedido */}
                <div className="space-y-3 mb-4">
                  <h4 className="font-semibold text-sm text-gray-600">Productos:</h4>
                  {pedido.detallesPedido.map((detalle) => (
                    <div key={detalle.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        {detalle.producto.imagen_url && (
                          <img 
                            src={detalle.producto.imagen_url} 
                            alt={detalle.producto.nombre}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium">{detalle.producto.nombre}</p>
                          <p className="text-sm text-muted-foreground">Cantidad: {detalle.cantidad}</p>
                        </div>
                      </div>
                      <p className="font-semibold">{formatCurrency(detalle.subtotal)}</p>
                    </div>
                  ))}
                </div>

                {/* Información de envío */}
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Dirección de Envío:</p>
                  <p className="text-sm text-gray-600">{pedido.direccion_envio}</p>
                  {pedido.telefono_cliente && (
                    <p className="text-sm text-gray-600 mt-1">Tel: {pedido.telefono_cliente}</p>
                  )}
                </div>

                {/* Detalles de Entrega y Regalo */}
                {(pedido.nombre_destinatario || pedido.tel_destinatario || pedido.horario_entrega || pedido.dedicatoria) && (
                  <div className="bg-pink-50 border border-pink-200 p-4 rounded-lg mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Gift className="h-5 w-5 text-[#D60464]" />
                      <h4 className="font-semibold text-gray-800">Detalles del Regalo</h4>
                    </div>
                    <div className="space-y-2">
                      {pedido.nombre_destinatario && (
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-gray-600 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Destinatario:</p>
                            <p className="text-sm font-medium text-gray-700">{pedido.nombre_destinatario}</p>
                          </div>
                        </div>
                      )}
                      {pedido.tel_destinatario && (
                        <div className="flex items-start gap-2">
                          <Phone className="h-4 w-4 text-gray-600 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Teléfono del Destinatario:</p>
                            <p className="text-sm font-medium text-gray-700">{pedido.tel_destinatario}</p>
                          </div>
                        </div>
                      )}
                      {pedido.horario_entrega && (
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-gray-600 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Horario de Entrega:</p>
                            <p className="text-sm font-medium text-gray-700">{pedido.horario_entrega}</p>
                          </div>
                        </div>
                      )}
                      {pedido.dedicatoria && (
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-gray-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Dedicatoria:</p>
                            <p className="text-sm italic text-gray-700 bg-white p-2 rounded border border-pink-100 mt-1">
                              "{pedido.dedicatoria}"
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Total y acciones */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Total del Pedido</p>
                    <p className="text-2xl font-bold text-[#D60464]">{formatCurrency(pedido.total)}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select 
                      value={pedido.estado} 
                      onValueChange={(nuevoEstado) => actualizarEstado(pedido.id, nuevoEstado)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Cambiar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="en_preparacion">En Preparación</SelectItem>
                        <SelectItem value="enviado">Enviado</SelectItem>
                        <SelectItem value="entregado">Entregado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
