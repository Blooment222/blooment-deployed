'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingCart, AlertTriangle, DollarSign, TrendingUp, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import Link from 'next/link'

export default function AdminDashboard() {
  const [metricas, setMetricas] = useState({
    pedidosHoy: 0,
    enviosPendientes: 0,
    productosBajoStock: 0,
    ventasHoy: 0,
    productosBajoStockList: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetricasOperativas()
  }, [])

  const fetchMetricasOperativas = async () => {
    try {
      // Fetch productos
      const productosRes = await fetch('/api/productos')
      const productos = await productosRes.json()
      
      // Fetch pedidos
      const pedidosRes = await fetch('/api/pedidos')
      const pedidos = await pedidosRes.json()

      // Calcular métricas operativas
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)

      // Pedidos nuevos del día
      const pedidosHoy = pedidos.filter(p => {
        const fechaPedido = new Date(p.createdAt)
        fechaPedido.setHours(0, 0, 0, 0)
        return fechaPedido.getTime() === hoy.getTime()
      })

      // Envíos pendientes (no entregados ni cancelados)
      const enviosPendientes = pedidos.filter(p => 
        p.estado !== 'entregado' && p.estado !== 'cancelado'
      ).length

      // Productos con bajo stock (< 10 unidades)
      const productosBajoStock = productos.filter(p => p.stock < 10)

      // Ventas del día (suma de totales de pedidos de hoy)
      const ventasHoy = pedidosHoy.reduce((sum, p) => sum + (p.total || 0), 0)

      setMetricas({
        pedidosHoy: pedidosHoy.length,
        enviosPendientes,
        productosBajoStock: productosBajoStock.length,
        ventasHoy,
        productosBajoStockList: productosBajoStock.slice(0, 5) // Top 5 más críticos
      })
    } catch (error) {
      console.error('Error fetching métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Cargando métricas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#F5B6C6]">Dashboard Operativo</h1>
        <p className="text-muted-foreground">Métricas clave del día para gestionar tu florería</p>
      </div>

      {/* Métricas Operativas Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Pedidos Nuevos (Hoy) */}
        <Card className="border-[#F5B6C6] border-2 bg-gradient-to-br from-pink-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Pedidos Nuevos (Hoy)
            </CardTitle>
            <ShoppingCart className="h-5 w-5 text-[#F5B6C6]" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-[#F5B6C6]">
              {metricas.pedidosHoy}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {metricas.pedidosHoy === 0 
                ? 'Sin pedidos nuevos hoy' 
                : metricas.pedidosHoy === 1 
                ? 'Pedido recibido hoy' 
                : 'Pedidos recibidos hoy'}
            </p>
            <Link 
              href="/admin/pedidos"
              prefetch={true}
              className="text-xs text-[#F5B6C6] hover:underline mt-2 inline-block font-medium"
            >
              Ver todos los pedidos →
            </Link>
          </CardContent>
        </Card>

        {/* Envíos Pendientes */}
        <Card className="border-blue-200 border-2 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Envíos Pendientes
            </CardTitle>
            <Package className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">
              {metricas.enviosPendientes}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Pedidos por preparar o entregar
            </p>
            <Link 
              href="/admin/pedidos"
              prefetch={true}
              className="text-xs text-blue-600 hover:underline mt-2 inline-block font-medium"
            >
              Gestionar envíos →
            </Link>
          </CardContent>
        </Card>

        {/* Productos con Poco Stock */}
        <Card className="border-orange-200 border-2 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Productos Bajo Stock
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-600">
              {metricas.productosBajoStock}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Productos con menos de 10 unidades
            </p>
            <Link 
              href="/admin/productos"
              prefetch={true}
              className="text-xs text-orange-600 hover:underline mt-2 inline-block font-medium"
            >
              Reabastecer inventario →
            </Link>
          </CardContent>
        </Card>

        {/* Ventas del Día */}
        <Card className="border-green-200 border-2 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Ventas del Día
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(metricas.ventasHoy)}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Total en pedidos de hoy
            </p>
            <Link 
              href="/admin/finanzas"
              prefetch={true}
              className="text-xs text-green-600 hover:underline mt-2 inline-block font-medium"
            >
              Ver análisis completo →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Productos Bajo Stock */}
      {metricas.productosBajoStockList.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              Alerta: Productos que Requieren Atención
            </CardTitle>
            <CardDescription>
              Estos productos tienen stock bajo y podrían agotarse pronto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metricas.productosBajoStockList.map((producto) => (
                <div 
                  key={producto.id} 
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{producto.nombre}</p>
                    <p className="text-sm text-gray-600">{producto.tipo_flor || 'Producto'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">{producto.stock}</p>
                    <p className="text-xs text-gray-500">unidades</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/admin/productos" prefetch={true}>
              <button className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg py-2 font-semibold">
                Ir a Gestionar Inventario
              </button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Accede rápidamente a las secciones más importantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/admin/productos"
              prefetch={true}
              className="flex flex-col items-center justify-center p-6 bg-[#F5B6C6]/10 rounded-lg hover:bg-[#F5B6C6]/20 transition-colors border-2 border-transparent hover:border-[#F5B6C6]"
            >
              <Package className="h-8 w-8 text-[#F5B6C6] mb-2" />
              <span className="font-medium text-gray-700">Gestionar Productos</span>
            </Link>
            <Link
              href="/admin/pedidos"
              prefetch={true}
              className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border-2 border-transparent hover:border-blue-400"
            >
              <ShoppingCart className="h-8 w-8 text-blue-600 mb-2" />
              <span className="font-medium text-gray-700">Ver Pedidos</span>
            </Link>
            <Link
              href="/admin/finanzas"
              prefetch={true}
              className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border-2 border-transparent hover:border-green-400"
            >
              <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
              <span className="font-medium text-gray-700">Análisis Financiero</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
