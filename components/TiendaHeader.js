'use client'

import React, { useState, useMemo, useCallback, memo, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCarrito } from '@/lib/carrito-context'
import { Search, ShoppingBag, X, Flower } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/currency'

// Componente de sugerencia de producto memoizado
const SearchSuggestion = memo(function SearchSuggestion({ producto, onClick }) {
  return (
    <button
      onClick={() => onClick(producto)}
      className="w-full flex items-center gap-3 p-3 hover:bg-pink-50 rounded-lg transition-colors text-left touch-manipulation"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-pink-100">
        {producto.imagen_url ? (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Flower className="w-6 h-6 text-pink-300" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">{producto.nombre}</p>
        <p className="text-sm text-[#F5B6C6] font-semibold">{formatCurrency(producto.precio)}</p>
      </div>
    </button>
  )
})

function TiendaHeaderComponent() {
  const pathname = usePathname()
  const router = useRouter()
  const { items = [] } = useCarrito()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isPulsing, setIsPulsing] = useState(false)
  const [productos, setProductos] = useState([])
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)
  
  // Ocultar logo en página de Cuenta
  const hideLogo = useMemo(() => {
    return pathname === '/tienda/cuenta' || pathname === '/tienda/login' || pathname === '/tienda/register'
  }, [pathname])

  const totalCarrito = useMemo(() => {
    if (!items || !Array.isArray(items)) return 0
    return items.reduce((sum, item) => sum + item.cantidad, 0)
  }, [items])

  // Cargar productos al abrir búsqueda
  useEffect(() => {
    if (searchOpen && productos.length === 0) {
      setIsLoadingSearch(true)
      fetch('/api/productos')
        .then(res => res.json())
        .then(data => {
          console.log('📦 Productos cargados del API:', data)
          // El API devuelve un array directamente, no un objeto con .productos
          const productosArray = Array.isArray(data) ? data : (data.productos || [])
          console.log('✅ Productos procesados:', productosArray.length)
          setProductos(productosArray)
          setIsLoadingSearch(false)
        })
        .catch(err => {
          console.error('❌ Error cargando productos:', err)
          setIsLoadingSearch(false)
        })
    }
  }, [searchOpen, productos.length])

  // Filtrar productos en tiempo real - SOLO coincidencias exactas
  const sugerencias = useMemo(() => {
    if (!searchQuery.trim()) return []
    
    console.log('🔍 Filtrando productos:', { 
      query: searchQuery, 
      totalProductos: productos.length,
      productos: productos.slice(0, 3).map(p => p.nombre)
    })
    
    const query = searchQuery.toLowerCase().trim()
    
    // Buscar SOLO coincidencias exactas o parciales
    const coincidencias = productos.filter(p => {
      const nombre = (p.nombre || '').toLowerCase()
      const tipo = (p.tipo_flor || '').toLowerCase()
      const categoria = (p.categoria || '').toLowerCase()
      const ocasion = (p.ocasion || '').toLowerCase()
      
      return nombre.includes(query) || 
             tipo.includes(query) || 
             categoria.includes(query) ||
             ocasion.includes(query)
    })
    
    console.log('✅ Coincidencias encontradas:', coincidencias.length)
    
    // Devolver SOLO las coincidencias (máximo 8)
    // Si no hay coincidencias, devuelve array vacío
    return coincidencias.slice(0, 8)
  }, [searchQuery, productos])
  
  // Ya no necesitamos mostrandoAlternativas
  const mostrandoAlternativas = false

  const handleSearchClick = useCallback(() => {
    // Animación de pulso
    setIsPulsing(true)
    setTimeout(() => setIsPulsing(false), 300)
    
    // Abrir overlay de búsqueda
    setTimeout(() => setSearchOpen(true), 150)
  }, [])

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false)
    setSearchQuery('')
  }, [])

  const handleSuggestionClick = useCallback((producto) => {
    setSearchOpen(false)
    setSearchQuery('')
    // Navegar a la tienda con el producto seleccionado (se abrirá el modal)
    router.push(`/tienda?producto=${producto.id}`)
  }, [router])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm will-change-transform">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Icono de Lupa con Animación */}
          <button 
            onPointerDown={handleSearchClick}
            className={`p-2 hover:bg-pink-50 rounded-lg transition-all touch-manipulation ${
              isPulsing ? 'scale-110' : 'scale-100'
            }`}
            style={{ 
              transition: 'transform 0.3s ease',
              WebkitTapHighlightColor: 'transparent'
            }}
            aria-label="Buscar productos"
          >
            <Search className="w-6 h-6 text-[#F5B7C0]" />
          </button>

          {/* Logo Centrado - Oculto en página de Cuenta */}
          {!hideLogo && (
            <Link href="/tienda" className="absolute left-1/2 transform -translate-x-1/2" prefetch={true}>
              <div className="relative w-12 h-12">
                <Image
                  src="/blooment-logo-final.png?v=3"
                  alt="Blooment"
                  fill
                  className="object-contain"
                  priority
                  quality={90}
                  sizes="48px"
                />
              </div>
            </Link>
          )}

          {/* Icono de Carrito con atributos para animación */}
          <Link 
            href="/tienda/carrito" 
            className="relative p-2 hover:bg-pink-50 rounded-lg transition-colors touch-manipulation" 
            prefetch={true}
          >
            <ShoppingBag 
              className="w-6 h-6 text-[#F5B7C0]" 
              data-cart-icon="true"
            />
            {totalCarrito > 0 && (
              <div 
                className="absolute -top-1 -right-1 w-5 h-5 bg-[#F5B7C0] rounded-full flex items-center justify-center"
                data-cart-badge="true"
              >
                <span className="text-xs text-white font-bold">{totalCarrito}</span>
              </div>
            )}
          </Link>
        </div>
      </header>

      {/* Overlay de Búsqueda Funcional */}
      {searchOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/50 animate-in fade-in duration-200"
          onClick={handleSearchClose}
        >
          <div 
            className="absolute top-0 left-0 right-0 bg-white shadow-lg animate-in slide-in-from-top duration-300 max-h-screen overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="container mx-auto px-4 py-6">
              {/* Input de búsqueda - Más compacto */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#F5B7C0]" />
                <Input
                  type="text"
                  placeholder="Buscar flores, ramos, arreglos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-base rounded-full border-2 border-[#F5B7C0] focus:border-[#F5B7C0] focus:ring-0 bg-white"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSearchClose}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-pink-50 rounded-full transition-colors touch-manipulation"
                  aria-label="Cerrar búsqueda"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Sugerencias en tiempo real */}
              {isLoadingSearch ? (
                <div className="text-center py-8 text-gray-500">
                  Cargando productos...
                </div>
              ) : searchQuery.trim() ? (
                sugerencias.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 px-3 mb-3">
                      {sugerencias.length} {sugerencias.length === 1 ? 'resultado' : 'resultados'}
                    </p>
                    {sugerencias.map((producto) => (
                      <SearchSuggestion
                        key={producto.id}
                        producto={producto}
                        onClick={handleSuggestionClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="relative w-24 h-24 mx-auto mb-3">
                      <Image
                        src="/isotipo-rama-organica.png"
                        alt="Blooment"
                        fill
                        className="object-contain opacity-20"
                      />
                    </div>
                    <p className="text-gray-500 font-medium">No se encontraron resultados</p>
                    <p className="text-sm text-gray-400 mt-1">Intenta con otras palabras</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <Image
                      src="/isotipo-rama-organica.png"
                      alt="Blooment"
                      fill
                      className="object-contain opacity-40"
                    />
                  </div>
                  <p className="text-gray-500 font-medium">Escribe para buscar flores</p>
                  <p className="text-sm text-gray-400 mt-1">Rosas, tulipanes, arreglos...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Memoizar el componente completo
export const TiendaHeader = memo(TiendaHeaderComponent)
