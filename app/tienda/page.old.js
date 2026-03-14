'use client'

import React, { useEffect, useState, useMemo, useCallback, memo } from 'react'
import Image from 'next/image'
import { TiendaLayoutWrapper } from '@/components/TiendaLayoutWrapper'
import { useCarrito } from '@/lib/carrito-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Star, Sparkles, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

// Memoized ProductCard component para evitar re-renders innecesarios
const ProductCard = memo(function ProductCard({ producto, featured = false }) {
  const { addItem } = useCarrito()
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = useCallback(() => {
    setIsAdding(true)
    addItem(producto, 1)
    setTimeout(() => setIsAdding(false), 500)
  }, [producto, addItem])

  const precio = useMemo(() => {
    return producto.en_oferta && producto.precio_oferta 
      ? producto.precio_oferta 
      : producto.precio
  }, [producto.en_oferta, producto.precio_oferta, producto.precio])

  if (featured) {
    return (
      <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 bg-white border-pink-200 transform hover:scale-105">
        <div className="relative h-72 bg-gradient-to-br from-pink-50 to-pink-100">
          {producto.imagen_url ? (
            <Image
              src={producto.imagen_url}
              alt={producto.nombre}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              priority={false}
              loading="lazy"
              quality={75}
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
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover"
            loading="lazy"
            quality={75}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-pink-300">
            Sin imagen
          </div>
        )}
        {producto.en_oferta && producto.porcentaje_descuento && (
          <Badge className="absolute top-2 right-2 bg-[#F5B6C6] rounded-full px-3 py-1 text-sm">
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
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {producto.descripcion || 'Hermosas flores frescas'}
        </p>
        <div className="flex items-center gap-1">
          {producto.en_oferta && producto.precio_oferta ? (
            <>
              <span className="text-lg font-black text-[#F5B6C6]">
                ${precio.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground line-through">
                ${producto.precio.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-lg font-black">MXN ${precio.toFixed(2)}</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full bg-[#F5B6C6] hover:bg-[#F5B6C6] rounded-full h-9 text-sm font-bold"
          onClick={handleAddToCart}
          disabled={producto.stock === 0 || isAdding}
        >
          <ShoppingCart className="mr-1 h-4 w-4" />
          {producto.stock === 0 ? 'Agotado' : 'Agregar'}
        </Button>
      </CardFooter>
    </Card>
  )
})

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

  // Fetch con cache - solo se ejecuta una vez
  useEffect(() => {
    let isMounted = true
    
    const fetchProductos = async () => {
      // Verificar cache del navegador primero
      const cacheKey = 'productos_cache'
      const cacheTime = 'productos_cache_time'
      const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

      try {
        // Intentar obtener del cache
        const cachedData = localStorage.getItem(cacheKey)
        const cachedTime = localStorage.getItem(cacheTime)
        
        if (cachedData && cachedTime) {
          const timeElapsed = Date.now() - parseInt(cachedTime)
          if (timeElapsed < CACHE_DURATION) {
            if (isMounted) {
              setProductos(JSON.parse(cachedData))
              setLoading(false)
            }
            return
          }
        }

        // Fetch desde API si no hay cache válido
        const res = await fetch('/api/productos', {
          headers: {
            'Cache-Control': 'max-age=300' // Cache por 5 minutos
          }
        })
        
        if (!res.ok) throw new Error('Error al cargar productos')
        
        const data = await res.json()
        
        if (isMounted) {
          setProductos(data)
          // Guardar en cache
          localStorage.setItem(cacheKey, JSON.stringify(data))
          localStorage.setItem(cacheTime, Date.now().toString())
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProductos()

    return () => {
      isMounted = false
    }
  }, []) // Solo se ejecuta una vez al montar

  // Memoizar tipos disponibles
  const tiposDisponibles = useMemo(() => {
    return [...new Set(productos.map(p => p.tipo_flor).filter(Boolean))]
  }, [productos])

  // Memoizar productos filtrados
  const productosFiltrados = useMemo(() => {
    return filtroTipo === 'todos' 
      ? productos 
      : productos.filter(p => p.tipo_flor === filtroTipo)
  }, [productos, filtroTipo])

  // Memoizar categorías de productos
  const floresDelMomento = useMemo(() => {
    return productosFiltrados.filter(p => p.stock > 0).slice(0, 3)
  }, [productosFiltrados])

  const bestSellers = useMemo(() => {
    return productosFiltrados.filter(p => p.stock > 0).slice(0, 4)
  }, [productosFiltrados])

  const promociones = useMemo(() => {
    return productosFiltrados.filter(p => {
      if (!p.en_oferta || !p.precio_oferta) return false
      
      if (p.fecha_inicio_oferta && p.fecha_fin_oferta) {
        const ahora = new Date()
        const inicio = new Date(p.fecha_inicio_oferta)
        const fin = new Date(p.fecha_fin_oferta)
        return ahora >= inicio && ahora <= fin
      }
      
      return true
    }).slice(0, 6)
  }, [productosFiltrados])

  const handleFiltroChange = useCallback((tipo) => {
    setFiltroTipo(tipo)
  }, [])

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <Button onClick={() => window.location.reload()} className="rounded-full">Reintentar</Button>
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
              onClick={() => handleFiltroChange('todos')}
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
                onClick={() => handleFiltroChange(tipo)}
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

      {loading ? (
        <>
          {/* Flores del Momento Loading */}
          <section>
            <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
              <Star className="text-[#F5B6C6] fill-[#F5B6C6]" />
              Flores del Momento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <ProductSkeleton key={i} featured />
              ))}
            </div>
          </section>

          {/* Best Sellers Loading */}
          <section>
            <h2 className="text-2xl font-black mb-4">Los Más Vendidos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Flores del Momento */}
          {floresDelMomento.length > 0 && (
            <section>
              <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
                <Star className="text-[#F5B6C6] fill-[#F5B6C6]" />
                Flores del Momento
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {floresDelMomento.map((producto) => (
                  <ProductCard key={producto.id} producto={producto} featured />
                ))}
              </div>
            </section>
          )}

          {/* Best Sellers */}
          {bestSellers.length > 0 && (
            <section>
              <h2 className="text-2xl font-black mb-4">Los Más Vendidos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {bestSellers.map((producto) => (
                  <ProductCard key={producto.id} producto={producto} />
                ))}
              </div>
            </section>
          )}

          {/* Promociones */}
          {promociones.length > 0 && (
            <section className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-[#F5B6C6] fill-[#F5B6C6]" />
                <h2 className="text-2xl font-black">Ofertas Especiales</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                {promociones.map((producto) => (
                  <ProductCard key={producto.id} producto={producto} />
                ))}
              </div>
            </section>
          )}

          {/* No hay productos */}
          {productosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No hay productos disponibles en este momento</p>
            </div>
          )}
        </>
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
