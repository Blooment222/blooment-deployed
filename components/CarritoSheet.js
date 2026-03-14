'use client'

import React from 'react'
import Image from 'next/image'
import { X, Plus, Minus, Trash2 } from 'lucide-react'
import { useCarrito } from '@/lib/carrito-context'
import { useClienteAuth } from '@/lib/cliente-auth'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useRouter } from 'next/navigation'

export function CarritoSheet() {
  const { items, removeItem, updateQuantity, getTotal, isOpen, setIsOpen, getItemCount } = useCarrito()
  const { user } = useClienteAuth()
  const router = useRouter()

  const handleCheckout = () => {
    setIsOpen(false)
    // Small delay to ensure sheet closes before navigation
    setTimeout(() => {
      if (!user) {
        router.push('/tienda/login?redirect=detalles-entrega')
      } else {
        router.push('/tienda/detalles-entrega')
      }
    }, 100)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">
            Carrito ({getItemCount()})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
            <p className="text-muted-foreground">Tu carrito está vacío</p>
            <Button 
              className="mt-4 bg-[#F5B7C0] hover:bg-[#F5B7C0] rounded-full"
              onClick={() => setIsOpen(false)}
            >
              Continuar Comprando
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6 h-[calc(100vh-250px)] mt-6">
              <div className="space-y-4">
                {items.map((item) => {
                  const precio = item.en_oferta && item.precio_oferta ? item.precio_oferta : item.precio
                  
                  return (
                    <div key={item.id} className="flex gap-4 py-4 border-b">
                      <div className="relative w-20 h-20 flex-shrink-0 bg-stone-100 rounded-md overflow-hidden">
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

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.nombre}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {item.en_oferta && item.precio_oferta ? (
                            <>
                              <span className="text-[#F5B7C0] font-semibold">
                                MXN ${item.precio_oferta.toFixed(2)}
                              </span>
                              <span className="text-xs text-muted-foreground line-through">
                                MXN ${item.precio.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold">
                              MXN ${item.precio.toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.cantidad}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 ml-auto text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span className="text-[#F5B7C0]">MXN ${getTotal().toFixed(2)}</span>
              </div>
              <Button 
                className="w-full bg-[#F5B7C0] hover:bg-[#F5B7C0] h-12 text-base font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
                onClick={handleCheckout}
              >
                {user ? 'Proceder al Pago' : 'Ingresar para Pagar'}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
