'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { TiendaLayoutWrapper } from '@/components/TiendaLayoutWrapper'
import { useCarrito } from '@/lib/carrito-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronDown, ChevronRight, Heart, Flower } from 'lucide-react'

function ProductCard({ producto }) {
  const carrito = useCarrito()
  const addItem = carrito?.addItem || (() => {})
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
    <Card className="relative overflow-hidden rounded-2xl shadow-md bg-white">
      <div className="relative h-40 bg-gradient-to-br from-pink-50 to-pink-100">
        {producto.imagen_url ? (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
            loading="lazy"
            quality={75}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Flower className="w-16 h-16 text-pink-300" />
          </div>
        )}
        <button className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md">
          <Heart className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm text-[#F5B6C6] mb-1 line-clamp-1">{producto.nombre}</h3>
        <p className="text-xs text-gray-500 mb-2 line-clamp-1">{producto.tipo_flor || 'Flores'}</p>
        <span className="text-lg font-bold text-[#F5B6C6] block mb-2">${precio.toFixed(0)}</span>
        <Button
          onClick={handleAddToCart}
          disabled={isAdding}
          className="w-full bg-[#F5B6C6] hover:bg-[#F5B6C6] text-white rounded-full h-9 text-xs"
        >
          Agregar
        </Button>
      </div>
    </Card>
  )
}

function AccordionItem({ title, items, isOpen, onToggle, onItemSelect }) {
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 px-4 hover:bg-pink-50 transition-colors"
      >
        <span className="text-base font-bold text-[#F5B6C6]">{title}</span>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-[#F5B6C6]" />
        ) : (
          <ChevronRight className="w-5 h-5 text-[#F5B6C6]" />
        )}
      </button>
      {isOpen && (
        <div className="bg-white pb-2">
          {items.map((item) => (
            <button
              key={item}
              onClick={() => onItemSelect(item)}
              className="w-full text-left py-3 px-8 text-sm text-gray-600 hover:bg-pink-50 hover:text-[#F5B6C6] transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ExplorarContent() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [openAccordion, setOpenAccordion] = useState(null)
  const [filtroActivo, setFiltroActivo] = useState(null)
  const [tipoFiltro, setTipoFiltro] = useState(null)

  const categorias = {
    'Por Tipo de Flor': ['Rosas', 'Tulipanes', 'Girasoles', 'Lirios', 'Orquídeas', 'Peonías'],
    'Por Ocasión': ['Cumpleaños', 'Aniversario', 'San Valentín', 'Día de la Madre', 'Bodas', 'Condolencias'],
    'Especiales': ['Arreglos Premium', 'Cajas de Lujo', 'Ramos Exclusivos', 'Combos']
  }

  useEffect(() => {
    const fetchProductos = async () => {
      try {
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

  const handleAccordionToggle = (categoria) => {
    setOpenAccordion(openAccordion === categoria ? null : categoria)
  }

  const handleItemSelect = (item, categoria) => {
    setFiltroActivo(item)
    setTipoFiltro(categoria)
    setOpenAccordion(null)
  }

  const limpiarFiltro = () => {
    setFiltroActivo(null)
    setTipoFiltro(null)
  }

  const productosFiltrados = useMemo(() => {
    if (!filtroActivo) return productos

    if (tipoFiltro === 'Por Tipo de Flor') {
      return productos.filter(p => p.tipo_flor === filtroActivo)
    } else if (tipoFiltro === 'Por Ocasión') {
      return productos.filter(p => 
        p.ocasion && p.ocasion.split(',').map(x => x.trim()).includes(filtroActivo)
      )
    }

    return productos
  }, [productos, filtroActivo, tipoFiltro])

  return (
    <div className="container mx-auto">
      {/* Título */}
      <div className="px-4 py-6 bg-gradient-to-r from-pink-50 to-purple-50">
        <h1 className="text-2xl font-bold text-[#F5B6C6] mb-1">Explorar</h1>
        <p className="text-sm text-gray-600">Descubre flores por categoría</p>
      </div>

      {/* Acordeones de Categorías */}
      <div className="bg-white">
        {Object.entries(categorias).map(([categoria, items]) => (
          <AccordionItem
            key={categoria}
            title={categoria}
            items={items}
            isOpen={openAccordion === categoria}
            onToggle={() => handleAccordionToggle(categoria)}
            onItemSelect={(item) => handleItemSelect(item, categoria)}
          />
        ))}
      </div>

      {/* Filtro Activo */}
      {filtroActivo && (
        <div className="px-4 py-4 bg-pink-50 border-b border-pink-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Mostrando:</p>
              <p className="text-sm font-bold text-[#F5B6C6]">{filtroActivo}</p>
            </div>
            <Button
              onClick={limpiarFiltro}
              variant="outline"
              size="sm"
              className="rounded-full border-[#F5B6C6] text-[#F5B6C6] hover:bg-[#F5B6C6] hover:text-white"
            >
              Limpiar
            </Button>
          </div>
        </div>
      )}

      {/* Grid de Productos Filtrados */}
      <div className="px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5B6C6] mx-auto"></div>
          </div>
        ) : productosFiltrados.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {productosFiltrados.map((producto) => (
              <ProductCard key={producto.id} producto={producto} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Flower className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No hay productos en esta categoría</p>
            <Button
              onClick={limpiarFiltro}
              className="bg-[#F5B6C6] hover:bg-[#F5B6C6] rounded-full"
            >
              Ver todos los productos
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ExplorarPage() {
  return (
    <TiendaLayoutWrapper>
      <ExplorarContent />
    </TiendaLayoutWrapper>
  )
}
