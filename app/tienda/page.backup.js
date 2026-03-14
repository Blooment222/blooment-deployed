'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { TiendaLayoutWrapper } from '@/components/TiendaLayoutWrapper'
import { useCarrito } from '@/lib/carrito-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Star, Sparkles, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

function ProductCard({ producto, featured = false }) {
  const { addItem } = useCarrito()
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    setIsAdding(true)
    addItem(producto, 1)
    setTimeout(() => setIsAdding(false), 500)
  }

  const precio = producto.en_oferta && producto.precio_oferta 
    ? producto.precio_oferta 
    : producto.precio

  if (featured) {
    return (
      <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 bg-white border-pink-200 transform hover:scale-105">
        <div className="relative h-72 bg-gradient-to-br from-pink-50 to-pink-100">
          {producto.imagen_url ? (
            <Image
              src={producto.imagen_url}
              alt={producto.nombre}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-pink-300">
              <Sparkles className="w-16 h-16" />
            </div>
          )}
          {producto.en_oferta && producto.porcentaje_descuento && (
            <Badge className="absolute top-3 right-3 bg-[#F5B6C6] hover:bg-[#F5B6C6] rounded-full px-4 py-2 text-base">
              🔥 -{producto.porcentaje_descuento}%
            </Badge>
          )}
          {producto.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="rounded-full px-4 py-2">Agotado</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-5">
          <h3 className="font-bold text-xl mb-2 line-clamp-1">{producto.nombre}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {producto.descripcion || 'Hermosas flores frescas'}
          </p>
          <div className="flex items-center gap-2">
            {producto.en_oferta && producto.precio_oferta ? (
              <>
                <span className="text-2xl font-black text-[#F5B6C6]">
                  MXN ${precio.toFixed(2)}
                </span>
                <span className="text-base text-muted-foreground line-through">
                  MXN ${producto.precio.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-black">MXN ${precio.toFixed(2)}</span>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-5 pt-0">
          <Button
            className="w-full bg-[#F5B6C6] hover:bg-[#F5B6C6] rounded-full h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all"
            onClick={handleAddToCart}
            disabled={producto.stock === 0 || isAdding}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {producto.stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 bg-white border-pink-200">
      <div className="relative h-48 bg-pink-50">
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
        {producto.en_oferta && producto.porcentaje_descuento && (
          <Badge className="absolute top-2 right-2 bg-[#F5B6C6] hover:bg-[#F5B6C6] rounded-full px-3 py-1">
            -{producto.porcentaje_descuento}%
          </Badge>
        )}
        {producto.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="secondary" className="rounded-full">Agotado</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold text-base mb-1 line-clamp-1">{producto.nombre}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
          {producto.descripcion || 'Hermosas flores frescas'}
        </p>
        <div className="flex items-center gap-2">
          {producto.en_oferta && producto.precio_oferta ? (
            <>
              <span className="text-lg font-black text-[#F5B6C6]">
                MXN ${precio.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground line-through">
                MXN ${producto.precio.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-lg font-black">MXN ${precio.toFixed(2)}</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full bg-[#F5B6C6] hover:bg-[#F5B6C6] rounded-full h-10 text-sm font-bold"
          onClick={handleAddToCart}
          disabled={producto.stock === 0 || isAdding}
        >
          <ShoppingCart className="mr-1 h-4 w-4" />
          {producto.stock === 0 ? 'Agotado' : 'Agregar'}
        </Button>
      </CardFooter>
    </Card>
  )
}

function ProductSkeleton({ featured = false }) {
  return (
    <Card className="overflow-hidden">
      <Skeleton className={`w-full ${featured ? 'h-72' : 'h-48'}`} />
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-2" />
        <Skeleton className="h-8 w-24" />
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-10 w-full rounded-full" />
      </CardFooter>
    </Card>
  )
}

function TiendaContent() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('todos')

  useEffect(() => {
    fetchProductos()
  }, [])

  const fetchProductos = async () => {
    try {
      const res = await fetch('/api/productos')
      if (!res.ok) throw new Error('Error al cargar productos')
      const data = await res.json()
      setProductos(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Obtener tipos únicos de flores
  const tiposDisponibles = [...new Set(productos.map(p => p.tipo_flor).filter(Boolean))]

  // Filtrar productos
  const productosFiltrados = filtroTipo === 'todos' 
    ? productos 
    : productos.filter(p => p.tipo_flor === filtroTipo)

  // Filtrar productos por categorías
  const floresDelMomento = productosFiltrados.filter(p => p.stock > 0).slice(0, 3)
  const bestSellers = productosFiltrados.filter(p => p.stock > 0).slice(0, 4)
  const promociones = productosFiltrados.filter(p => {
    if (!p.en_oferta || !p.precio_oferta) return false
    
    // Verificar si la oferta está vigente
    if (p.fecha_inicio_oferta && p.fecha_fin_oferta) {
      const ahora = new Date()
      const inicio = new Date(p.fecha_inicio_oferta)
      const fin = new Date(p.fecha_fin_oferta)
      return ahora >= inicio && ahora <= fin
    }
    
    return true
  }).slice(0, 6)

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <Button onClick={fetchProductos} className="rounded-full">Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Filtro por tipo de flor */}
      {tiposDisponibles.length > 0 && (
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                filtroTipo === 'todos'
                  ? 'bg-[#F5B6C6] text-white shadow-lg'
                  : 'bg-pink-100 text-[#F5B6C6] hover:bg-pink-200'
              }`}
            >
              🌸 Todas
            </button>
            {tiposDisponibles.map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  filtroTipo === tipo
                    ? 'bg-[#F5B6C6] text-white shadow-lg'
                    : 'bg-pink-100 text-[#F5B6C6] hover:bg-pink-200'
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Flores del Momento - Hero Section */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <Clock className="w-7 h-7 text-[#F5B6C6]" />
          <div>
            <h2 className="text-2xl font-black text-gray-900">Flores del Momento</h2>
            <p className="text-sm text-gray-600">Las más frescas y hermosas de hoy</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[...Array(3)].map((_, i) => (
              <ProductSkeleton key={i} featured />
            ))}
          </div>
        ) : floresDelMomento.length === 0 ? (
          <div className="text-center py-12 bg-pink-50 rounded-3xl">
            <p className="text-muted-foreground">No hay flores disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {floresDelMomento.map((producto) => (
              <ProductCard key={producto.id} producto={producto} featured />
            ))}
          </div>
        )}
      </section>

      {/* Best Sellers */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <Star className="w-7 h-7 text-[#F5B6C6] fill-current" />
          <div>
            <h2 className="text-2xl font-black text-gray-900">Best Sellers</h2>
            <p className="text-sm text-gray-600">Los más vendidos</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : bestSellers.length === 0 ? (
          <div className="text-center py-8 bg-pink-50 rounded-3xl">
            <p className="text-muted-foreground">No hay productos disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {bestSellers.map((producto) => (
              <ProductCard key={producto.id} producto={producto} />
            ))}
          </div>
        )}
      </section>

      {/* Promociones */}
      {promociones.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Sparkles className="w-7 h-7 text-[#F5B6C6]" />
            <div>
              <h2 className="text-2xl font-black text-gray-900">Promociones 🎉</h2>
              <p className="text-sm text-gray-600">Ofertas especiales que no puedes perder</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-[#F5B6C6] to-[#E71E7A] text-white rounded-3xl p-4 mb-4 text-center">
                <p className="font-bold text-lg">
                  🔥 {promociones.length} {promociones.length === 1 ? 'producto' : 'productos'} en oferta
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {promociones.map((producto) => (
                  <ProductCard key={producto.id} producto={producto} />
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}

export default function TiendaPage() {
  return (
    <TiendaLayoutWrapper>
      <TiendaContent />
    </TiendaLayoutWrapper>
  )
}
