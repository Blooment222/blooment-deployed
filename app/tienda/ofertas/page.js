'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { TiendaLayoutWrapper } from '@/components/TiendaLayoutWrapper'
import { useCarrito } from '@/lib/carrito-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

function ProductCard({ producto }) {
  const { addItem } = useCarrito()
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    setIsAdding(true)
    addItem(producto, 1)
    setTimeout(() => setIsAdding(false), 500)
  }

  const precio = producto.precio_oferta || producto.precio

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-[#F5B6C6] border-opacity-30">
      <div className="relative h-64 bg-pink-50">
        {producto.imagen_url ? (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-pink-300">
            Sin imagen
          </div>
        )}
        {producto.porcentaje_descuento && (
          <Badge className="absolute top-2 right-2 bg-[#F5B6C6] text-lg px-3 py-1">
            -{producto.porcentaje_descuento}%
          </Badge>
        )}
        {producto.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="secondary">Agotado</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{producto.nombre}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {producto.descripcion || 'Hermosas flores frescas'}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-[#F5B6C6]">
            MXN ${precio.toFixed(2)}
          </span>
          <span className="text-lg text-muted-foreground line-through">
            MXN ${producto.precio.toFixed(2)}
          </span>
        </div>
        <p className="text-sm text-green-600 font-medium mt-1">
          ¡Ahorras MXN ${(producto.precio - precio).toFixed(2)}!
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full bg-[#F5B6C6] hover:bg-[#F5B6C6]"
          onClick={handleAddToCart}
          disabled={producto.stock === 0 || isAdding}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {producto.stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
        </Button>
      </CardFooter>
    </Card>
  )
}

function ProductSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-64 w-full" />
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-2" />
        <Skeleton className="h-8 w-24" />
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  )
}

function OfertasContent() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProductos()
  }, [])

  const fetchProductos = async () => {
    try {
      const res = await fetch('/api/productos')
      if (!res.ok) throw new Error('Error al cargar productos')
      const data = await res.json()
      // Filtrar solo productos en oferta
      const productosEnOferta = data.filter(p => p.en_oferta && p.precio_oferta)
      setProductos(productosEnOferta)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <Button onClick={fetchProductos}>Reintentar</Button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Ofertas Especiales 🌸</h1>
        <p className="text-gray-600">Aprovecha nuestros precios especiales en flores selectas</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : productos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😔</div>
          <p className="text-muted-foreground text-lg mb-2">
            No hay ofertas disponibles en este momento
          </p>
          <p className="text-sm text-muted-foreground">
            Vuelve pronto para encontrar increíbles descuentos
          </p>
        </div>
      ) : (
        <>
          <div className="bg-pink-50 border border-[#F5B6C6] border-opacity-30 rounded-2xl p-4 mb-6">
            <p className="text-center font-medium text-gray-800">
              🎉 {productos.length} {productos.length === 1 ? 'producto' : 'productos'} en oferta
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productos.map((producto) => (
              <ProductCard key={producto.id} producto={producto} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function OfertasPage() {
  return (
    <TiendaLayoutWrapper>
      <OfertasContent />
    </TiendaLayoutWrapper>
  )
}
