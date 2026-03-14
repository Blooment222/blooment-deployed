// Componentes optimizados y memoizados para la página de cuenta
import React, { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Scissors, Truck, Heart, Edit, X, Trash2, Package } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatCurrency } from '@/lib/currency'

// Componente de Línea de Seguimiento Animada - MEMOIZADO
export const OrderTimeline = memo(function OrderTimeline({ estado }) {
  const steps = [
    { id: 'pendiente', label: 'Pedido Recibido', icon: CheckCircle2 },
    { id: 'en_preparacion', label: 'En Preparación', icon: Scissors },
    { id: 'enviado', label: 'En Camino', icon: Truck },
    { id: 'entregado', label: 'Entregado', icon: Heart }
  ]

  const currentStepIndex = steps.findIndex(step => step.id === estado)
  const activeIndex = currentStepIndex !== -1 ? currentStepIndex : 0

  return (
    <div className="py-6 px-4">
      <div className="relative">
        <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200" style={{ left: 'calc(12.5%)', right: 'calc(12.5%)', width: '75%' }}></div>
        <div className="absolute top-8 h-1 bg-[#F5B6C6] transition-all duration-700 ease-in-out" style={{ left: 'calc(12.5%)', width: `${(activeIndex / (steps.length - 1)) * 75}%` }}></div>

        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            const isCompleted = index < activeIndex
            const isCurrent = index === activeIndex
            const isFuture = index > activeIndex
            
            return (
              <div key={step.id} className="flex flex-col items-center" style={{ width: '25%' }}>
                <div className="relative">
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-500 relative z-10
                    ${isCompleted ? 'bg-[#F5B6C6] border-[#F5B6C6] shadow-lg' : ''}
                    ${isCurrent ? 'bg-[#F5B6C6] border-[#F5B6C6] shadow-xl animate-pulse' : ''}
                    ${isFuture ? 'bg-white border-gray-200' : ''}
                  `}>
                    <StepIcon className={`w-7 h-7 transition-colors duration-500 ${isCompleted || isCurrent ? 'text-white' : 'text-gray-300'}`} />
                  </div>
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-[#F5B6C6] opacity-20 animate-ping"></div>
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p className={`text-xs font-semibold ${isCompleted || isCurrent ? 'text-[#F5B6C6]' : 'text-gray-400'}`}>
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
})

// Card de Pedido - MEMOIZADO
export const PedidoCard = memo(function PedidoCard({ 
  pedido, 
  onEdit, 
  onCancel, 
  onDelete 
}) {
  return (
    <Card className="border-[#F5B6C6]/30 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl overflow-hidden">
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
                  onClick={() => onDelete(pedido.id)}
                  type="button"
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
                <Button
                  onClick={() => onEdit(pedido)}
                  className="flex-1 bg-[#F5B6C6] hover:bg-[#F5B6C6]/90 text-white rounded-full font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                  type="button"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Pedido
                </Button>
                
                <Button
                  onClick={() => onCancel(pedido.id)}
                  variant="outline"
                  className="flex-1 border-2 border-[#F5B6C6] text-[#F5B6C6] hover:bg-red-50 hover:border-red-400 hover:text-red-600 rounded-full font-semibold transition-all duration-200"
                  type="button"
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
}, (prevProps, nextProps) => {
  // Solo re-renderizar si el pedido cambió
  return prevProps.pedido.id === nextProps.pedido.id && 
         prevProps.pedido.estado === nextProps.pedido.estado &&
         prevProps.pedido.updatedAt === nextProps.pedido.updatedAt
})
