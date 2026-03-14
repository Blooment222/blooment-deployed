'use client'

import React, { useState, useMemo, useCallback, memo, useRef } from 'react'
import Image from 'next/image'
import { useCarrito } from '@/lib/carrito-context'
import { useProductos } from '@/lib/use-productos'
import { useCartAnimation } from '@/hooks/useCartAnimation'
import { TiendaLayoutWrapper } from '@/components/TiendaLayoutWrapper'
import { ProductDetailModal } from '@/components/ProductDetailModal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Heart, Flower, ShoppingBag, Loader2, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'

// Componente de Card de Producto Memoizado con Animación Local
const ProductCard = memo(function ProductCard({ producto, featured = false, badge, onViewDetail }) {
  const carrito = useCarrito()
  const addItem = carrito?.addItem || (() => {})
  const { animateButton } = useCartAnimation()
  const [isAdding, setIsAdding] = useState(false)
  const [showAdded, setShowAdded] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const buttonRef = useRef(null)

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation() // Prevenir abrir modal al hacer clic en botón
    e.preventDefault()   // Prevenir comportamiento por defecto
    
    // 1. Respuesta INSTANTÁNEA: Actualizar UI inmediatamente (Optimistic UI)
    setIsAdding(true)
    setShowAdded(true)
    
    // 2. Agregar al carrito (síncrono)
    addItem(producto, 1)
    
    // 3. Disparar animación local en el botón (burst de partículas)
    if (buttonRef.current) {
      animateButton(buttonRef.current)
    }
    
    // 4. Resetear estado después de la animación
    setTimeout(() => {
      setIsAdding(false)
      setShowAdded(false)
    }, 800)
  }, [producto, addItem, animateButton])

  const handleImageClick = useCallback(() => {
    onViewDetail(producto)
  }, [producto, onViewDetail])

  const precio = useMemo(() => {
    return producto.en_oferta && producto.precio_oferta 
      ? producto.precio_oferta 
      : producto.precio
  }, [producto.en_oferta, producto.precio_oferta, producto.precio])

  if (featured) {
    return (
      <Card className="relative overflow-hidden rounded-3xl shadow-md bg-white hover:shadow-xl transition-shadow duration-300">
        {badge && (
          <div className="absolute top-4 left-4 z-10">
            <div className="w-10 h-10 rounded-full bg-[#F5B6C6] flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">#{badge}</span>
            </div>
          </div>
        )}
        {producto.en_oferta && (
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-[#F5B6C6] text-white px-3 py-1 rounded-full">
              OFERTA
            </Badge>
          </div>
        )}
        
        <div 
          className="relative h-72 bg-gradient-to-br from-pink-50 to-pink-100 cursor-pointer transition-transform hover:scale-105"
          onClick={handleImageClick}
        >
          {producto.imagen_url ? (
            <Image
              src={producto.imagen_url}
              alt={producto.nombre}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              loading="lazy"
              quality={75}
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Flower className="w-24 h-24 text-pink-300" />
            </div>
          )}
          
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:scale-110 transition-transform"
            aria-label="Agregar a favoritos"
          >
            <Heart 
              className={`w-5 h-5 ${isFavorite ? 'fill-[#F5B6C6] text-[#F5B6C6]' : 'text-gray-600'}`}
            />
          </button>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-lg text-[#F5B6C6] mb-1">{producto.nombre}</h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-1">
            {producto.tipo_flor || 'Flores frescas'}
          </p>
          
          <div className="flex items-center justify-between mb-4">
            {producto.en_oferta && producto.precio_oferta ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[#F5B6C6]">
                  {formatCurrency(precio)}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  {formatCurrency(producto.precio)}
                </span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-[#F5B6C6]">
                {formatCurrency(precio)}
              </span>
            )}
          </div>

          <Button 
            ref={buttonRef}
            onPointerDown={handleAddToCart}
            disabled={isAdding}
            className="w-full bg-[#F5B6C6] hover:bg-[#F5B6C6]/90 text-white font-semibold rounded-full transition-all touch-action-manipulation"
          >
            {showAdded ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                ¡Agregado!
              </>
            ) : isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Agregando...
              </>
            ) : (
              <>
                <ShoppingBag className="mr-2 h-4 w-4" />
                Agregar al Carrito
              </>
            )}
          </Button>
        </div>
      </Card>
    )
  }

  // Card normal (versión compacta para grid)
  return (
    <Card className="overflow-hidden rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-200 bg-white">
      {producto.en_oferta && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-[#F5B6C6] text-white text-xs px-2 py-0.5 rounded-full">
            OFERTA
          </Badge>
        </div>
      )}
      
      <div 
        className="relative h-48 bg-gradient-to-br from-pink-50 to-pink-100 cursor-pointer transition-transform hover:scale-105"
        onClick={handleImageClick}
      >
        {producto.imagen_url ? (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
            loading="lazy"
            quality={70}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Flower className="w-16 h-16 text-pink-300" />
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-sm text-[#F5B6C6] mb-1 line-clamp-1">{producto.nombre}</h3>
        
        <div className="flex items-center justify-between mb-2">
          {producto.en_oferta && producto.precio_oferta ? (
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-[#F5B6C6]">
                {formatCurrency(precio)}
              </span>
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(producto.precio)}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-[#F5B6C6]">
              {formatCurrency(precio)}
            </span>
          )}
        </div>

        <Button 
          ref={buttonRef}
          onPointerDown={handleAddToCart}
          disabled={isAdding}
          size="sm"
          className="w-full bg-[#F5B6C6] hover:bg-[#F5B6C6]/90 text-white font-semibold rounded-full text-xs touch-action-manipulation"
        >
          {showAdded ? (
            <>
              <Check className="mr-1 h-3 w-3" />
              ¡Listo!
            </>
          ) : isAdding ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              <ShoppingBag className="mr-1 h-3 w-3" />
              Agregar
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}, (prevProps, nextProps) => {
  return prevProps.producto.id === nextProps.producto.id && 
         prevProps.featured === nextProps.featured &&
         prevProps.badge === nextProps.badge
})

ProductCard.displayName = 'ProductCard'

// Skeleton para carga
function ProductSkeleton({ featured = false }) {
  if (featured) {
    return (
      <Card className="overflow-hidden rounded-3xl">
        <Skeleton className="h-72 w-full" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    )
  }
  
  return (
    <Card className="overflow-hidden rounded-2xl">
      <Skeleton className="h-48 w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-8 w-full" />
      </div>
    </Card>
  )
}

function TiendaContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('Todo')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const carrito = useCarrito()

  // Usar SWR para cargar productos con caché automático
  const { productos, isLoading, isError } = useProductos()

  // Funciones para manejar el modal
  const handleViewDetail = useCallback((producto) => {
    setSelectedProduct(producto)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedProduct(null), 300) // Delay para animación
  }, [])

  const handleAddToCartFromModal = useCallback((producto) => {
    carrito.addItem(producto, 1)
  }, [carrito])

  // Filtrado de productos con useMemo
  const productosFiltrados = useMemo(() => {
    let filtered = productos

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        p.nombre.toLowerCase().includes(query) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(query)) ||
        (p.tipo_flor && p.tipo_flor.toLowerCase().includes(query))
      )
    }

    if (categoriaActiva !== 'Todo') {
      filtered = filtered.filter(p => p.tipo_flor === categoriaActiva)
    }

    return filtered
  }, [productos, searchQuery, categoriaActiva])

  // Productos destacados (primeros 3)
  const productosDestacados = useMemo(() => 
    productosFiltrados.slice(0, 3),
    [productosFiltrados]
  )

  // Resto de productos
  const productosRegulares = useMemo(() => 
    productosFiltrados.slice(3),
    [productosFiltrados]
  )

  // Extraer categorías únicas
  const categorias = useMemo(() => {
    const tipos = [...new Set(productos.map(p => p.tipo_flor).filter(Boolean))]
    return ['Todo', ...tipos]
  }, [productos])

  // Mostrar error si hay
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <Flower className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Error al cargar productos</h2>
          <p className="text-gray-600">Por favor, intenta recargar la página</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-[#F5B6C6] hover:bg-[#F5B6C6]/90"
          >
            Recargar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-24">
      {/* Hero/Header - Degradado Sutil de Bordes a Centro y Título Rosa Centrado */}
      <div 
        className="px-4 py-6"
        style={{
          background: 'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(245,182,198,0.15) 50%, rgba(255,255,255,1) 100%)'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-[#F5B6C6] text-center w-full my-6">
            Blooment
          </h1>
        </div>
      </div>

      {/* Categorías */}
      <div className="px-4 py-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max max-w-7xl mx-auto">
          {categorias.map((categoria) => (
            <Button
              key={categoria}
              onClick={() => setCategoriaActiva(categoria)}
              variant={categoriaActiva === categoria ? 'default' : 'outline'}
              className={`rounded-full px-6 py-2 whitespace-nowrap transition-all ${
                categoriaActiva === categoria
                  ? 'bg-[#F5B6C6] text-white hover:bg-[#F5B6C6]/90'
                  : 'border-[#F5B6C6] text-[#F5B6C6] hover:bg-[#F5B6C6]/10'
              }`}
            >
              {categoria}
            </Button>
          ))}
        </div>
      </div>

      {/* Productos Destacados */}
      {!isLoading && productosDestacados.length > 0 && (
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-[#F5B6C6]">✨</span> Más Populares
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {productosDestacados.map((producto, idx) => (
                <ProductCard 
                  key={producto.id} 
                  producto={producto} 
                  featured={true}
                  badge={idx + 1}
                  onViewDetail={handleViewDetail}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Skeletons mientras carga */}
      {isLoading && (
        <>
          <div className="px-4 py-6">
            <div className="max-w-7xl mx-auto">
              <Skeleton className="h-8 w-48 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <ProductSkeleton key={i} featured={true} />
                ))}
              </div>
            </div>
          </div>
          <div className="px-4 py-6">
            <div className="max-w-7xl mx-auto">
              <Skeleton className="h-8 w-48 mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Resto de Productos */}
      {!isLoading && productosRegulares.length > 0 && (
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Todos los Productos</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {productosRegulares.map((producto) => (
                <ProductCard 
                  key={producto.id} 
                  producto={producto}
                  onViewDetail={handleViewDetail}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!isLoading && productosFiltrados.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] px-4">
          <Flower className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No se encontraron productos
          </h3>
          <p className="text-gray-500 text-center">
            {searchQuery 
              ? `No hay productos que coincidan con "${searchQuery}"`
              : 'No hay productos disponibles en esta categoría'}
          </p>
          {(searchQuery || categoriaActiva !== 'Todo') && (
            <Button 
              onClick={() => {
                setSearchQuery('')
                setCategoriaActiva('Todo')
              }}
              variant="outline"
              className="mt-4 border-[#F5B6C6] text-[#F5B6C6]"
            >
              Ver todos los productos
            </Button>
          )}
        </div>
      )}
      
      {/* Modal de Detalle de Producto */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddToCart={handleAddToCartFromModal}
      />
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
