'use client'

import React, { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { X, Ruler, Flower2, Info, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/currency'

/**
 * Modal de detalle de producto con animación zoom/expansión
 * Diseño Blooment: títulos negros, detalles rosa #F5B6C6
 */
function ProductDetailModalComponent({ product, isOpen, onClose, onAddToCart }) {
  if (!product) return null

  const descripcion = product.descripcion || 'Hermoso arreglo artesanal Blooment'
  const medidas = product.medidas || 'Medidas estándar'
  const floresIncluidas = product.flores_incluidas || 'Variedad de flores frescas seleccionadas'

  const precioFinal = product.en_oferta && product.precio_oferta 
    ? product.precio_oferta 
    : product.precio

  const handleAddToCart = () => {
    onAddToCart(product)
    // Opcionalmente cerrar el modal después de agregar
    // onClose()
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Fondo atenuado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal con animación optimizada */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ 
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1] // Ease personalizado más suave
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
                 style={{ willChange: 'transform' }}>
              {/* Botón cerrar */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10 touch-manipulation active:scale-95"
                aria-label="Cerrar"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>

              <div className="grid md:grid-cols-2 gap-8 p-8">
                {/* Imagen del producto */}
                <div className="relative">
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-pink-50 to-white"
                       style={{ willChange: 'transform' }}>
                    {product.imagen_url ? (
                      <Image
                        src={product.imagen_url}
                        alt={product.nombre}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Flower2 className="w-24 h-24 text-[#F5B6C6]/30" />
                      </div>
                    )}
                    
                    {/* Badge de oferta */}
                    {product.en_oferta && product.porcentaje_descuento && (
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-red-500 text-white px-3 py-1 text-sm font-bold">
                          -{product.porcentaje_descuento}% OFF
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información del producto */}
                <div className="flex flex-col"
                     style={{ willChange: 'transform' }}>
                  {/* Nombre */}
                  <h2 className="text-3xl font-bold text-black mb-2">
                    {product.nombre}
                  </h2>

                  {/* Categoría y ocasión */}
                  <div className="flex gap-2 mb-4">
                    {product.categoria && (
                      <Badge variant="outline" className="border-[#F5B6C6] text-[#F5B6C6]">
                        {product.categoria}
                      </Badge>
                    )}
                    {product.ocasion && (
                      <Badge variant="outline" className="border-[#F5B6C6] text-[#F5B6C6]">
                        {product.ocasion}
                      </Badge>
                    )}
                  </div>

                  {/* Precio */}
                  <div className="mb-6">
                    {product.en_oferta && product.precio_oferta ? (
                      <div className="flex items-center gap-3">
                        <span className="text-4xl font-bold text-[#F5B6C6]">
                          {formatCurrency(product.precio_oferta)}
                        </span>
                        <span className="text-xl text-gray-400 line-through">
                          {formatCurrency(product.precio)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-4xl font-bold text-[#F5B6C6]">
                        {formatCurrency(product.precio)}
                      </span>
                    )}
                  </div>

                  {/* Descripción */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-5 h-5 text-black" />
                      <h3 className="text-lg font-bold text-black">Descripción</h3>
                    </div>
                    <p className="text-[#F5B6C6] font-medium leading-relaxed">
                      {descripcion}
                    </p>
                  </div>

                  {/* Medidas */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Ruler className="w-5 h-5 text-black" />
                      <h3 className="text-lg font-bold text-black">Medidas</h3>
                    </div>
                    <p className="text-[#F5B6C6] font-medium">
                      {medidas}
                    </p>
                  </div>

                  {/* Flores incluidas */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                      <Flower2 className="w-5 h-5 text-black" />
                      <h3 className="text-lg font-bold text-black">Composición Floral</h3>
                    </div>
                    <p className="text-[#F5B6C6] font-medium leading-relaxed">
                      {floresIncluidas}
                    </p>
                  </div>

                  {/* Botón Agregar al Carrito */}
                  <Button
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className="w-full bg-[#F5B6C6] hover:bg-[#F5B6C6]/90 text-white py-6 rounded-full text-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-98"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {product.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export const ProductDetailModal = memo(ProductDetailModalComponent)
