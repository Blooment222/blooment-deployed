'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ShoppingBag, User, Package, Clock, CheckCircle, Truck, X, Gift, Phone, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-client'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { formatCurrency } from '@/lib/currency'

// Skeleton Loading Component
function PedidosSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-[180px]" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pedidos List Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function PedidosAdmin() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const ITEMS_PER_PAGE = 20
  
  const { getToken } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchPedidos()
  }, [currentPage, filter])

  const fetchPedidos = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        console.error('No hay token disponible')
        setLoading(false)
        return
      }

      // Fetch con paginación
      const res = await fetch(`/api/pedidos/admin/todos?page=${currentPage}&limit=${ITEMS_PER_PAGE}&filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.ok) {
        const data = await res.json()
        
        // Si el API no soporta paginación aún, hacerlo en el cliente
        if (Array.isArray(data)) {
          // Paginación del lado del cliente
          const filteredData = filter === 'todos' ? data : data.filter(p => p.estado === filter)
          const total = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
          const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
          const endIndex = startIndex + ITEMS_PER_PAGE
          const paginatedData = filteredData.slice(startIndex, endIndex)
          
          setPedidos(paginatedData)
          setTotalPages(total)
        } else {
          // Paginación del lado del servidor
          setPedidos(data.pedidos || [])
          setTotalPages(data.totalPages || 1)
        }
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

  // Mostrar skeleton mientras carga
  if (loading && pedidos.length === 0) {
    return <PedidosSkeleton />
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
          <Select value={filter} onValueChange={(value) => { setFilter(value); setCurrentPage(1); }}>
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

      {/* Lista de Pedidos */}
      <div className="space-y-4">
        {loading ? (
          // Skeleton mientras se actualiza
          <PedidosSkeleton />
        ) : pedidos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay pedidos para mostrar</p>
            </CardContent>
          </Card>
        ) : (
          pedidos.map((pedido) => (
            <Card key={pedido.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-[#F5B6C6]" />
                      Pedido #{pedido.id.slice(0, 8).toUpperCase()}
                    </CardTitle>
                    <CardDescription>
                      {new Date(pedido.createdAt).toLocaleString('es-MX', {
                        dateStyle: 'full',
                        timeStyle: 'short'
                      })}
                    </CardDescription>
                  </div>
                  {getEstadoBadge(pedido.estado)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Información del Cliente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Cliente</p>
                      <p className="text-sm text-gray-900">{pedido.cliente?.nombre || 'Sin nombre'}</p>
                      <p className="text-xs text-gray-500">{pedido.cliente?.email || 'Sin email'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Contacto</p>
                      <p className="text-sm text-gray-900">{pedido.cliente?.telefono || 'Sin teléfono'}</p>
                    </div>
                  </div>
                </div>

                {/* Información de Entrega */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Gift className="h-5 w-5 text-[#F5B6C6] mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Destinatario</p>
                      <p className="text-sm text-gray-900">{pedido.nombre_destinatario}</p>
                      <p className="text-xs text-gray-500">{pedido.tel_destinatario}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Dedicatoria</p>
                      <p className="text-sm text-gray-600 italic">{pedido.dedicatoria || 'Sin dedicatoria'}</p>
                    </div>
                  </div>
                </div>

                {/* Productos */}
                <div className="space-y-2">
                  <p className="font-semibold text-sm text-gray-700">Productos:</p>
                  {pedido.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm py-2 border-b last:border-b-0">
                      <span className="text-gray-700">{item.producto?.nombre || 'Producto'} x{item.cantidad}</span>
                      <span className="font-medium">{formatCurrency(item.precio_unitario * item.cantidad)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-lg font-bold pt-2 border-t-2">
                    <span>Total:</span>
                    <span className="text-[#F5B6C6]">{formatCurrency(pedido.total)}</span>
                  </div>
                </div>

                {/* Cambiar Estado */}
                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Cambiar Estado del Pedido
                  </label>
                  <Select
                    value={pedido.estado}
                    onValueChange={(nuevoEstado) => actualizarEstado(pedido.id, nuevoEstado)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
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
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
