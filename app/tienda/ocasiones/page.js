'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import { TiendaLayoutWrapper } from '@/components/TiendaLayoutWrapper'
import { useCarrito } from '@/lib/carrito-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Flower2, Heart, Gift, Calendar, Sparkles } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

// Iconos para ocasiones
const ocasionesIconos = {
  'Cumpleaños': '🎂',
  'Aniversario': '💕',
  'Graduación': '🎓',
  'Día de la Madre': '👩',
  'San Valentín': '💖',
  'Bodas': '💒',
  'Condolencias': '🕊️',
  'Agradecimiento': '🙏',
  'Amor': '❤️',
  'Amistad': '🤝',
  'default': '🌸'
}

// Iconos para tipos de flores
const floresIconos = {
  'Rosas': '🌹',
  'Tulipanes': '🌷',
  'Girasoles': '🌻',
  'Lirios': '🌺',
  'Orquídeas': '🌸',
  'Peonías': '🌼',
  'Hortensias': '💐',
  'default': '🌿'
}

function ProductCard({ producto }) {
  const { addItem } = useCarrito()
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = () => {
    setIsAdding(true)
    addItem(producto, 1)
    setTimeout(() => setIsAdding(false), 500)
  }

  const precio = producto.en_oferta && producto.precio_oferta 
    ? producto.precio_oferta 
    : producto.precio

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
            <Flower2 className="w-16 h-16" />
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
}

function CatalogoContent() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroActivo, setFiltroActivo] = useState('todos')
  const [tipoFiltro, setTipoFiltro] = useState('todos') // 'tipo' o 'ocasion'

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        // Intentar cache primero
        const cacheKey = 'productos_cache'
        const cacheTime = 'productos_cache_time'
        const CACHE_DURATION = 5 * 60 * 1000

        const cachedData = localStorage.getItem(cacheKey)
        const cachedTime = localStorage.getItem(cacheTime)
        
        if (cachedData && cachedTime) {
          const timeElapsed = Date.now() - parseInt(cachedTime)
          if (timeElapsed < CACHE_DURATION) {
            setProductos(JSON.parse(cachedData))
            setLoading(false)
            return
          }
        }

        const res = await fetch('/api/productos')
        if (!res.ok) throw new Error('Error al cargar productos')
        
        const data = await res.json()
        setProductos(data)
        
        localStorage.setItem(cacheKey, JSON.stringify(data))
        localStorage.setItem(cacheTime, Date.now().toString())
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProductos()
  }, [])

  // Extraer tipos de flores únicos
  const tiposFlores = useMemo(() => {
    const tipos = [...new Set(productos.map(p => p.tipo_flor).filter(Boolean))]
    return tipos.sort()
  }, [productos])

  // Extraer ocasiones únicas
  const ocasiones = useMemo(() => {
    const ocas = [...new Set(
      productos
        .map(p => p.ocasion)
        .filter(Boolean)
        .flatMap(o => o.split(',').map(x => x.trim()))
    )]
    return ocas.sort()
  }, [productos])

  // Filtrar productos
  const productosFiltrados = useMemo(() => {
    if (filtroActivo === 'todos') return productos

    if (tipoFiltro === 'tipo') {
      return productos.filter(p => p.tipo_flor === filtroActivo)
    } else if (tipoFiltro === 'ocasion') {
      return productos.filter(p => 
        p.ocasion && p.ocasion.split(',').map(x => x.trim()).includes(filtroActivo)
      )
    }

    return productos
  }, [productos, filtroActivo, tipoFiltro])

  const handleFiltro = (valor, tipo) => {
    setFiltroActivo(valor)
    setTipoFiltro(tipo)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-black text-[#F5B6C6] mb-2 flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 fill-[#F5B6C6]" />
          Catálogo de Flores
          <Sparkles className="w-8 h-8 fill-[#F5B6C6]" />
        </h1>
        <p className="text-muted-foreground">Encuentra las flores perfectas para cada ocasión</p>
      </div>

      {/* Botón Todos */}
      <div className="flex justify-center mb-4">
        <button
          onClick={() => handleFiltro('todos', 'todos')}
          className={`px-6 py-3 rounded-full text-base font-bold transition-all ${
            filtroActivo === 'todos'
              ? 'bg-[#F5B6C6] text-white shadow-lg scale-105'
              : 'bg-pink-100 text-[#F5B6C6] hover:bg-pink-200'
          }`}
        >
          🌸 Ver Todo el Catálogo
        </button>
      </div>

      {/* Tipos de Flores */}
      {tiposFlores.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-md">
          <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-[#F5B6C6]">
            <Flower2 className="w-6 h-6" />
            Por Tipo de Flor
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {tiposFlores.map((tipo) => (
              <button
                key={tipo}
                onClick={() => handleFiltro(tipo, 'tipo')}
                className={`p-4 rounded-2xl text-center transition-all transform hover:scale-105 ${
                  filtroActivo === tipo && tipoFiltro === 'tipo'
                    ? 'bg-[#F5B6C6] text-white shadow-xl scale-105'
                    : 'bg-gradient-to-br from-pink-50 to-purple-50 text-gray-700 hover:shadow-lg'
                }`}
              >
                <div className="text-3xl mb-2">
                  {floresIconos[tipo] || floresIconos.default}
                </div>
                <div className="text-sm font-bold">{tipo}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ocasiones */}
      {ocasiones.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-md">
          <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-[#F5B6C6]">
            <Gift className="w-6 h-6" />
            Por Ocasión
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {ocasiones.map((ocasion) => (
              <button
                key={ocasion}
                onClick={() => handleFiltro(ocasion, 'ocasion')}
                className={`p-4 rounded-2xl text-center transition-all transform hover:scale-105 ${
                  filtroActivo === ocasion && tipoFiltro === 'ocasion'
                    ? 'bg-[#F5B6C6] text-white shadow-xl scale-105'
                    : 'bg-gradient-to-br from-pink-50 to-purple-50 text-gray-700 hover:shadow-lg'
                }`}
              >
                <div className="text-3xl mb-2">
                  {ocasionesIconos[ocasion] || ocasionesIconos.default}
                </div>
                <div className="text-sm font-bold">{ocasion}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resultados */}
      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black">
            {filtroActivo === 'todos' 
              ? 'Todos los Productos' 
              : `${productosFiltrados.length} Productos`
            }
          </h2>
          {filtroActivo !== 'todos' && (
            <Badge variant="secondary" className="text-sm">
              Filtro activo: {filtroActivo}
            </Badge>
          )}
        </div>
        
        {productosFiltrados.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {productosFiltrados.map((producto) => (
              <ProductCard key={producto.id} producto={producto} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Flower2 className="w-16 h-16 mx-auto text-pink-300 mb-4" />
            <p className="text-muted-foreground text-lg">
              No hay productos disponibles para este filtro
            </p>
            <Button
              onClick={() => handleFiltro('todos', 'todos')}
              className="mt-4 bg-[#F5B6C6] hover:bg-[#F5B6C6] rounded-full"
            >
              Ver todo el catálogo
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CatalogoPage() {
  return (
    <TiendaLayoutWrapper>
      <CatalogoContent />
    </TiendaLayoutWrapper>
  )
}
