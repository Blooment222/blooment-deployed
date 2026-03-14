'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const CarritoContext = createContext({})

export function CarritoProvider({ children }) {
  const [items, setItems] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  // Cargar carrito del localStorage al iniciar (non-blocking)
  useEffect(() => {
    // Ejecutar de forma no bloqueante
    const timeoutId = setTimeout(() => {
      const savedCart = localStorage.getItem('carrito')
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart)
          setItems(parsed)
        } catch (error) {
          console.error('Error loading cart:', error)
          localStorage.removeItem('carrito')
        }
      }
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [])

  // Guardar carrito en localStorage cuando cambie (debounced)
  useEffect(() => {
    // Usar setTimeout para no bloquear con cada cambio
    const timeoutId = setTimeout(() => {
      try {
        if (items.length > 0) {
          localStorage.setItem('carrito', JSON.stringify(items))
        } else {
          localStorage.removeItem('carrito')
        }
      } catch (error) {
        console.error('Error saving cart:', error)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [items])

  const addItem = useCallback((producto, cantidad = 1) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === producto.id)
      
      if (existingItem) {
        // Si ya existe, aumentar cantidad
        return prevItems.map(item =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        )
      } else {
        // Si no existe, agregar nuevo
        return [...prevItems, { ...producto, cantidad }]
      }
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((productoId) => {
    setItems(prevItems => prevItems.filter(item => item.id !== productoId))
  }, [])

  const updateQuantity = useCallback((productoId, cantidad) => {
    if (cantidad <= 0) {
      setItems(prevItems => prevItems.filter(item => item.id !== productoId))
      return
    }
    
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === productoId ? { ...item, cantidad } : item
      )
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    try {
      localStorage.removeItem('carrito')
    } catch (error) {
      console.error('Error clearing cart:', error)
    }
  }, [])

  const getTotal = useCallback(() => {
    return items.reduce((total, item) => {
      const precio = item.en_oferta && item.precio_oferta ? item.precio_oferta : item.precio
      return total + (precio * item.cantidad)
    }, 0)
  }, [items])

  const getItemCount = useCallback(() => {
    return items.reduce((count, item) => count + item.cantidad, 0)
  }, [items])

  const toggleCart = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  // Memoizar el value del context para evitar re-renders innecesarios
  const contextValue = useMemo(() => ({
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
    isOpen,
    toggleCart,
    setIsOpen
  }), [items, addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount, isOpen, toggleCart])

  return (
    <CarritoContext.Provider value={contextValue}>
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito() {
  return useContext(CarritoContext)
}
