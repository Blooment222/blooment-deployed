'use client'

import React, { memo, useMemo, useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useCarrito } from '@/lib/carrito-context'
import { Home, Flower, ShoppingBag, User } from 'lucide-react'

// Componente de ítem de navegación con respuesta INSTANTÁNEA
const NavItem = memo(function NavItem({ href, icon: Icon, label, isActive, badge, onNavigate }) {
  const router = useRouter()
  
  // onPointerDown para respuesta INMEDIATA (antes de levantar el dedo)
  const handlePointerDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 1. Actualización visual OPTIMISTA (instantánea)
    onNavigate(href)
    
    // 2. Navegación en segundo plano
    router.push(href)
  }
  
  // Fallback para dispositivos que no soportan pointer events
  const handleTouchStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onNavigate(href)
    router.push(href)
  }

  return (
    <button
      onPointerDown={handlePointerDown}
      onTouchStart={handleTouchStart}
      className="flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[48px] min-h-[48px] touch-manipulation select-none active:scale-95"
      aria-label={label}
      type="button"
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transition: 'transform 0.05s ease' // Solo transform, no color
      }}
    >
      <div className="relative flex items-center justify-center w-full">
        <Icon 
          className={`w-6 h-6 pointer-events-none ${
            isActive ? 'text-[#EFA6AD]' : 'text-[#A9A9A9]'
          }`}
          style={{ transition: 'none' }} // Sin transición de color
        />
        {badge > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#EFA6AD] rounded-full flex items-center justify-center shadow-sm pointer-events-none">
            <span className="text-[10px] text-white font-bold">{badge}</span>
          </div>
        )}
      </div>
      <span 
        className={`text-xs whitespace-nowrap pointer-events-none ${
          isActive ? 'text-[#EFA6AD]' : 'text-[#707070]'
        }`}
        style={{ transition: 'none' }} // Sin transición de color
      >
        {label}
      </span>
    </button>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.href === nextProps.href &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.badge === nextProps.badge
  )
})

NavItem.displayName = 'NavItem'

function TiendaBottomNavComponent() {
  const pathname = usePathname()
  const router = useRouter()
  const { items = [] } = useCarrito()
  
  // Estado local para UI optimista (cambio instantáneo)
  const [optimisticPath, setOptimisticPath] = useState(pathname)
  
  // Sincronizar con pathname real cuando cambie
  useEffect(() => {
    setOptimisticPath(pathname)
  }, [pathname])
  
  // Prefetch de todas las páginas principales al montar
  useEffect(() => {
    // Prefetch obligatorio de las 4 páginas principales
    router.prefetch('/tienda')
    router.prefetch('/tienda/explorar')
    router.prefetch('/tienda/carrito')
    router.prefetch('/tienda/cuenta')
  }, [router])

  // Memoizar el cálculo del total del carrito
  const totalCarrito = useMemo(() => {
    if (!items || !Array.isArray(items)) return 0
    return items.reduce((sum, item) => sum + (item?.cantidad || 0), 0)
  }, [items])

  // Handler para navegación optimista
  const handleOptimisticNavigate = (href) => {
    // Cambio instantáneo del estado para feedback visual inmediato
    setOptimisticPath(href)
  }

  // Determinar qué tab está activo (usando path optimista)
  const isActive = useMemo(() => {
    return {
      inicio: optimisticPath === '/tienda',
      explorar: optimisticPath === '/tienda/explorar',
      carrito: optimisticPath === '/tienda/carrito',
      cuenta: optimisticPath === '/tienda/cuenta' || 
              optimisticPath === '/tienda/login' || 
              optimisticPath === '/tienda/register'
    }
  }, [optimisticPath])

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 will-change-transform"
      style={{ touchAction: 'manipulation' }}
    >
      <div className="flex justify-around items-stretch py-1 max-w-7xl mx-auto">
        <NavItem 
          href="/tienda" 
          icon={Home} 
          label="Inicio" 
          isActive={isActive.inicio} 
          badge={0}
          onNavigate={handleOptimisticNavigate}
        />
        
        <NavItem 
          href="/tienda/explorar" 
          icon={Flower} 
          label="Explorar" 
          isActive={isActive.explorar} 
          badge={0}
          onNavigate={handleOptimisticNavigate}
        />
        
        <NavItem 
          href="/tienda/carrito" 
          icon={ShoppingBag} 
          label="Carrito" 
          isActive={isActive.carrito} 
          badge={totalCarrito}
          onNavigate={handleOptimisticNavigate}
        />
        
        <NavItem 
          href="/tienda/cuenta" 
          icon={User} 
          label="Cuenta" 
          isActive={isActive.cuenta} 
          badge={0}
          onNavigate={handleOptimisticNavigate}
        />
      </div>
    </nav>
  )
}

// Exportar sin memoización agresiva para permitir actualizaciones necesarias
export const TiendaBottomNav = memo(TiendaBottomNavComponent)
