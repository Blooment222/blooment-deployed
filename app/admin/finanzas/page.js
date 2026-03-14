'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingDown, TrendingUp, BarChart3, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { Button } from '@/components/ui/button'

export default function FinanzasPage() {
  const [finanzas, setFinanzas] = useState(null)
  const [periodo, setPeriodo] = useState('mes')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFinanzas()
  }, [periodo])

  const fetchFinanzas = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`/api/finanzas/metricas?periodo=${periodo}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        setFinanzas(data)
      }
    } catch (error) {
      console.error('Error fetching finanzas:', error)
    } finally {
      setLoading(false)
    }
  }

  const periodos = [
    { value: 'dia', label: 'Hoy' },
    { value: 'semana', label: 'Semana' },
    { value: 'mes', label: 'Mes' },
    { value: 'año', label: 'Año' }
  ]

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Finanzas</h1>
          <p className="text-muted-foreground">Cargando datos financieros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#F5B6C6] flex items-center gap-2">
          <TrendingUp className="w-8 h-8" />
          Finanzas y Análisis
        </h1>
        <p className="text-muted-foreground">Métricas financieras detalladas de tu florería</p>
      </div>

      {/* Filtros de Período */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Período de Análisis
              </CardTitle>
              <CardDescription>Selecciona el rango de tiempo para las métricas financieras</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {periodos.map((p) => (
              <Button
                key={p.value}
                variant={periodo === p.value ? "default" : "outline"}
                onClick={() => setPeriodo(p.value)}
                className={periodo === p.value ? "bg-[#F5B6C6] hover:bg-[#F5B6C6]/90" : ""}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métricas Financieras */}
      {finanzas && (
        <div className="space-y-4">
          {/* Tarjetas de Resumen Financiero */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Ventas Totales */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-900">
                  Ventas Totales
                </CardTitle>
                <DollarSign className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700">
                  {formatCurrency(finanzas.resumen.ventas_totales)}
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {finanzas.resumen.numero_pedidos} pedidos
                </p>
              </CardContent>
            </Card>

            {/* Costos Totales */}
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-900">
                  Costos Totales
                </CardTitle>
                <TrendingDown className="h-5 w-5 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-700">
                  {formatCurrency(finanzas.resumen.costos_totales)}
                </div>
                <p className="text-xs text-red-600 mt-1">
                  Productos + Envíos
                </p>
              </CardContent>
            </Card>

            {/* Utilidad Neta */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-900">
                  Utilidad Neta
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700">
                  {formatCurrency(finanzas.resumen.utilidad_neta)}
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Margen: {finanzas.resumen.margen_utilidad.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            {/* Ticket Promedio */}
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-900">
                  Ticket Promedio
                </CardTitle>
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700">
                  {formatCurrency(finanzas.resumen.ticket_promedio)}
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  Por pedido
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Desglose de Costos */}
          <Card>
            <CardHeader>
              <CardTitle>Desglose de Costos y Gastos</CardTitle>
              <CardDescription>Análisis detallado de los gastos operativos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">Costo de Productos</p>
                    <p className="text-sm text-gray-600">Flores y materiales vendidos</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(finanzas.resumen.costo_productos)}
                  </p>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">Costos de Envío</p>
                    <p className="text-sm text-gray-600">Servicios de entrega</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(finanzas.resumen.costo_envios)}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-gray-900">Total de Gastos</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(finanzas.resumen.costos_totales)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Productos */}
          {finanzas.top_productos && finanzas.top_productos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Productos Más Vendidos</CardTitle>
                <CardDescription>Top 5 productos por ingresos en el período seleccionado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {finanzas.top_productos.map((producto, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F5B6C6]/10 flex items-center justify-center font-bold text-[#F5B6C6]">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{producto.nombre}</p>
                          <p className="text-sm text-gray-600">{producto.cantidad} unidades vendidas</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(producto.ingresos)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estado de Pedidos */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de Pedidos</CardTitle>
              <CardDescription>Distribución de pedidos por estado en el período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-3xl font-bold text-yellow-700">{finanzas.pedidos_por_estado.pendiente}</p>
                  <p className="text-sm text-yellow-600 mt-1">Pendiente</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-3xl font-bold text-blue-700">{finanzas.pedidos_por_estado.en_preparacion}</p>
                  <p className="text-sm text-blue-600 mt-1">En Preparación</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-3xl font-bold text-purple-700">{finanzas.pedidos_por_estado.enviado}</p>
                  <p className="text-sm text-purple-600 mt-1">Enviado</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-3xl font-bold text-green-700">{finanzas.pedidos_por_estado.entregado}</p>
                  <p className="text-sm text-green-600 mt-1">Entregado</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-3xl font-bold text-red-700">{finanzas.pedidos_por_estado.cancelado}</p>
                  <p className="text-sm text-red-600 mt-1">Cancelado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!finanzas && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No hay datos financieros disponibles para el período seleccionado</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
